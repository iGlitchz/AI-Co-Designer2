const express = require('express');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const WebSocket = require('ws');
const crypto = require('crypto');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json({ limit: '50mb' }));
// Dev safety: avoid stale cached frontend assets masking bug fixes.
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(express.static('public'));

// ── OpenRouter client ───────────────────────────────────────────────────────
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY || '';
const OPENROUTER_PRIMARY_MODEL = 'google/gemma-3-4b-it';
const OPENROUTER_FALLBACK_MODEL = 'google/gemma-3n-e4b-it:free';
const OPENROUTER_MODEL = OPENROUTER_PRIMARY_MODEL;
const VISION_API_KEY = process.env.GOOGLE_CLOUD_VISION_API_KEY;
const PRODUCT_INFO_DEBUG = process.env.PRODUCT_INFO_DEBUG !== 'false';

function summarizeProductInfo(info) {
  if (!info || typeof info !== 'object') return { hasData: false };
  return {
    hasData: true,
    productName: info.productName || '',
    useCase: info.context?.useCase || '',
    targetAudience: info.context?.targetAudience || '',
    primaryFunction: info.purpose?.primaryFunction || ''
  };
}

function logProductInfoDebug(stage, payload) {
  if (!PRODUCT_INFO_DEBUG) return;
  console.log(`[ProductInfoDebug:${stage}]`, payload);
}

if (OPENROUTER_API_KEY) {
  console.log('✅ OpenRouter API key found');
  console.log(`🚀 Using model: ${OPENROUTER_MODEL}`);
} else {
  console.error('❌ No OPENROUTER_API_KEY found. Please add it to your .env file');
}

async function callOpenRouter(messages, options = {}) {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  const explicitModel = typeof options.model === 'string' ? options.model.trim() : '';
  const allowFallback = options.allowFallback !== false;
  const primaryModel = explicitModel || OPENROUTER_PRIMARY_MODEL;

  const sendRequest = async (model) => axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model, messages },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Co-Designer'
      }
    }
  );

  let response;
  try {
    response = await sendRequest(primaryModel);
  } catch (err) {
    if (allowFallback && OPENROUTER_FALLBACK_MODEL && OPENROUTER_FALLBACK_MODEL !== primaryModel) {
      const status = err.response?.status || 'unknown';
      console.warn(`⚠️ OpenRouter model ${primaryModel} failed (${status}). Retrying with fallback model: ${OPENROUTER_FALLBACK_MODEL}`);
      response = await sendRequest(OPENROUTER_FALLBACK_MODEL);
    } else {
      throw err;
    }
  }

  const content = response.data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string' || !content.trim()) {
    throw new Error('Empty response from OpenRouter');
  }
  return content.trim();
}

async function callOpenRouterStream(messages, sendFn) {
  if (!OPENROUTER_API_KEY) throw new Error('OpenRouter API key not configured');

  const sendStreamRequest = async (model) => axios.post(
    'https://openrouter.ai/api/v1/chat/completions',
    { model, messages, stream: true },
    {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Co-Designer'
      },
      responseType: 'stream'
    }
  );

  let axiosRes;
  try {
    axiosRes = await sendStreamRequest(OPENROUTER_PRIMARY_MODEL);
  } catch (err) {
    if (OPENROUTER_FALLBACK_MODEL && OPENROUTER_FALLBACK_MODEL !== OPENROUTER_PRIMARY_MODEL) {
      const status = err.response?.status || 'unknown';
      console.warn(`⚠️ OpenRouter primary stream model failed (${status}). Retrying with fallback model: ${OPENROUTER_FALLBACK_MODEL}`);
      axiosRes = await sendStreamRequest(OPENROUTER_FALLBACK_MODEL);
    } else {
      throw err;
    }
  }

  return new Promise((resolve, reject) => {
    let fullContent = '';
    let buf = '';

    axiosRes.data.on('data', (chunk) => {
      buf += chunk.toString();
      const lines = buf.split('\n');
      buf = lines.pop();
      for (const line of lines) {
        if (!line.startsWith('data: ')) continue;
        const raw = line.slice(6).trim();
        if (raw === '[DONE]') continue;
        try {
          const parsed = JSON.parse(raw);
          const token = parsed.choices?.[0]?.delta?.content || '';
          if (token) {
            fullContent += token;
            sendFn({ token });
          }
        } catch {}
      }
    });

    axiosRes.data.on('end', () => resolve(fullContent));
    axiosRes.data.on('error', reject);
  });
}

if (VISION_API_KEY) {
  console.log('✅ Google Cloud Vision API key found');
} else {
  console.log('⚠️ No Google Cloud Vision API key - image analysis disabled');
}

// Load mode configurations
function loadModeConfig() {
  try {
    const configPath = path.join(__dirname, 'modes.conf');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const modes = {};
    
    const lines = configContent.split('\n');
    let currentMode = null;
    let currentPrompt = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      if (trimmed.startsWith('mode=')) {
        // Save previous mode if exists
        if (currentMode && currentPrompt) {
          modes[currentMode] = currentPrompt.trim();
        }
        
        currentMode = trimmed.split('=')[1];
        currentPrompt = '';
      } else if (trimmed.startsWith('system_prompt=')) {
        currentPrompt = trimmed.substring('system_prompt='.length);
      } else if (currentMode && trimmed && !trimmed.startsWith('#')) {
        // Continue multi-line prompt
        currentPrompt += ' ' + trimmed;
      }
    }
    
    // Save last mode
    if (currentMode && currentPrompt) {
      modes[currentMode] = currentPrompt.trim();
    }
    
    console.log('✅ Loaded modes:', Object.keys(modes));
    return modes;
  } catch (error) {
    console.error('❌ Failed to load modes config:', error.message);
    return {
      ideation: 'You are a creative brainstorming assistant.',
      conceptualization: 'You are a concept development specialist.',
      execution: 'You are an execution-focused assistant.'
    };
  }
}

const modes = loadModeConfig();

// Load agent resources
function loadAgentResources(agentType) {
  try {
    const agentFileMap = {
      'ergonomics': 'ergonomics_agent.md',
      'brand': 'brand_master.md',
      'researcher': 'design_researcher.md',
      'cmft': 'cmft_expert.md'
    };
    
    const fileName = agentFileMap[agentType];
    if (!fileName) return null;
    
    const resourcePath = path.join(__dirname, 'agent_resources', fileName);
    if (fs.existsSync(resourcePath)) {
      return fs.readFileSync(resourcePath, 'utf8');
    }
    return null;
  } catch (error) {
    console.error(`❌ Failed to load resources for ${agentType}:`, error.message);
    return null;
  }
}

// Build enhanced system prompt with agent context
function buildAgentPrompt(basePrompt, agents, projectContext, imageAnalysis = null) {
  let enhancedPrompt = basePrompt || 'You are a helpful design assistant.';
  
  // Add project context if available
  if (projectContext && Object.keys(projectContext).some(key => projectContext[key] && projectContext[key] !== '')) {
    enhancedPrompt += '\n\n## PROJECT CONTEXT\n';
    enhancedPrompt += 'Here is information about the current project:\n';
    if (projectContext.productName) enhancedPrompt += `Product Name: ${projectContext.productName}\n`;
    if (projectContext.direction) enhancedPrompt += `Direction: ${projectContext.direction}\n`;
    if (projectContext.context?.useCase) enhancedPrompt += `Use Case: ${projectContext.context.useCase}\n`;
    if (projectContext.purpose?.primaryFunction) enhancedPrompt += `Primary Function: ${projectContext.purpose.primaryFunction}\n`;
  }
  
  // Add image analysis context if available
  if (imageAnalysis) {
    enhancedPrompt += '\n\n## VISUAL ANALYSIS\n';
    enhancedPrompt += imageAnalysis;
  }
  
  // Add agent-specific context
  if (agents && agents.length > 0) {
    enhancedPrompt += '\n\n## SPECIALIZED AGENTS\n';
    enhancedPrompt += `You are collaborating with ${agents.length} specialized agent(s). Each agent will provide their expert perspective:\n\n`;
    
    agents.forEach(agentType => {
      const agentResources = loadAgentResources(agentType);
      if (agentResources) {
        enhancedPrompt += agentResources + '\n\n';
      }
    });
    
    enhancedPrompt += `\nIMPORTANT: Provide a comprehensive response that integrates insights from all ${agents.length} agent perspective(s). Structure your response with clear sections for each agent's analysis, using their specialized knowledge and frameworks. Be thorough, specific, and actionable.`;
  }
  
  return enhancedPrompt;
}

function buildProjectInfoLines(value, prefix = '', lines = []) {
  if (value === null || value === undefined) return lines;

  if (Array.isArray(value)) {
    const cleaned = value
      .map((item) => (typeof item === 'string' ? item.trim() : item))
      .filter((item) => item !== '' && item !== null && item !== undefined);
    if (cleaned.length > 0 && prefix) {
      lines.push(`${prefix}: ${cleaned.join(', ')}`);
    }
    return lines;
  }

  if (typeof value === 'object') {
    Object.entries(value).forEach(([key, child]) => {
      const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (ch) => ch.toUpperCase()).trim();
      const nextPrefix = prefix ? `${prefix} > ${label}` : label;
      buildProjectInfoLines(child, nextPrefix, lines);
    });
    return lines;
  }

  if (typeof value === 'string') {
    const text = value.trim();
    if (text && prefix) lines.push(`${prefix}: ${text}`);
    return lines;
  }

  if (prefix) lines.push(`${prefix}: ${String(value)}`);
  return lines;
}

function buildImagePromptWithProjectInfo(prompt, productInfo) {
  const basePrompt = String(prompt || '').trim();
  if (!productInfo || typeof productInfo !== 'object') return basePrompt;

  const contextLines = buildProjectInfoLines(productInfo);
  if (contextLines.length === 0) return basePrompt;

  return [
    'Use this project context as strict design guidance while generating the image:',
    ...contextLines,
    '',
    `Image request: ${basePrompt}`
  ].join('\n');
}

function buildVisionGroundedUserPrompt(visionSummary, userPrompt = '', analyze = false) {
  const promptText = String(userPrompt || '').trim();

  if (analyze) {
    return [
      'You are given visual evidence extracted from the attached image(s).',
      'Use it as the factual visual grounding for your answer.',
      '',
      '[Vision Evidence] ',
      visionSummary,
      '',
      'Task: Provide a thorough critical analysis that combines the visual evidence and the user context.',
      `User context: ${promptText || 'None provided.'}`,
      'Write naturally and fluently. Do not quote or repeat the raw evidence block verbatim.'
    ].join('\n');
  }

  return [
    'You are given visual evidence extracted from the attached image(s).',
    'Use it as factual grounding and answer the user naturally.',
    '',
    '[Vision Evidence]',
    visionSummary,
    '',
    `User request: ${promptText || 'What do you see?'}`,
    'Respond fluently by integrating both the user request and visual evidence. Do not list detector output unless asked.'
  ].join('\n');
}

function getDefaultProductInfo() {
  return {
    productName: '', direction: '',
    size: { dimensions: '', scale: '', notes: '' },
    color: { palette: [], primary: '', secondary: '', notes: '' },
    form: { shape: '', style: '', aesthetics: '', notes: '' },
    context: { useCase: '', environment: '', targetAudience: '', notes: '' },
    purpose: { primaryFunction: '', problemSolved: '', goals: [], notes: '' },
    cmft: { certifications: [], materials: [], finish: '', testing: [], notes: '' },
    features: { core: [], secondary: [], innovative: [], notes: '' },
    generalNotes: ''
  };
}

function mergeProductInfo(baseInfo, updates) {
  const mergedInfo = JSON.parse(JSON.stringify(baseInfo || getDefaultProductInfo()));
  if (!updates || typeof updates !== 'object') return mergedInfo;

  function mergeField(target, source, key) {
    if (source[key] === undefined || source[key] === null || source[key] === '') return;

    if (Array.isArray(source[key])) {
      if (source[key].length > 0) {
        target[key] = [...new Set([...(target[key] || []), ...source[key]])];
      }
      return;
    }

    if (typeof source[key] === 'object') {
      if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
        target[key] = {};
      }
      Object.keys(source[key]).forEach((subKey) => mergeField(target[key], source[key], subKey));
      return;
    }

    target[key] = source[key];
  }

  Object.keys(updates).forEach((key) => mergeField(mergedInfo, updates, key));
  return mergedInfo;
}

function parseJsonObjectFromText(raw) {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/```json\n?/gi, '').replace(/```\n?/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch {}

  const firstBrace = cleaned.indexOf('{');
  const lastBrace = cleaned.lastIndexOf('}');
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    const candidate = cleaned.slice(firstBrace, lastBrace + 1);
    try {
      return JSON.parse(candidate);
    } catch {}
  }

  return null;
}

function extractProductInfoHeuristic(userMessage) {
  const text = String(userMessage || '').trim();
  const lower = text.toLowerCase();
  if (!text) return {};

  const updates = {
    color: { palette: [] },
    cmft: { materials: [] },
    features: { core: [] },
    purpose: { goals: [] }
  };

  const dimensionMatch = text.match(/\b\d+(?:\.\d+)?\s?(?:mm|cm|m|in|inch|inches)\s?[x×]\s?\d+(?:\.\d+)?\s?(?:mm|cm|m|in|inch|inches)(?:\s?[x×]\s?\d+(?:\.\d+)?\s?(?:mm|cm|m|in|inch|inches))?/i);
  if (dimensionMatch) updates.size = { dimensions: dimensionMatch[0] };

  // Product name: explicit label ("called X", "named X", "product name is X")
  const productNameExplicit = text.match(/(?:called|name(?:d)?|product name is)\s+"?([A-Za-z0-9\-\s]{2,60})"?/i);
  if (productNameExplicit) {
    updates.productName = productNameExplicit[1].trim();
  }

  // Product name: natural language ("I want to make/create/design/build a X")
  if (!updates.productName) {
    const GENERIC = /^(?:product|thing|item|device|something|concept|design|prototype|object)$/i;
    const makeMatch = text.match(/(?:make|create|design|build|develop|produce|working on|designing|building|creating|making|developing)\s+(?:a|an|the)\s+([A-Za-z][A-Za-z0-9\-\s]{1,49}?)(?:\s+for\b|\s+that\b|\s+which\b|\s+to\b|[,.]|$)/i);
    if (makeMatch) {
      const candidate = makeMatch[1].trim();
      if (!GENERIC.test(candidate)) updates.productName = candidate;
    }
  }

  const materialKeywords = ['rubber', 'silicone', 'aluminum', 'aluminium', 'steel', 'plastic', 'polycarbonate', 'wood', 'foam', 'leather', 'textile', 'stainless', 'titanium', 'carbon fiber', 'ceramic', 'glass'];
  materialKeywords.forEach((mat) => {
    if (lower.includes(mat)) updates.cmft.materials.push(mat);
  });

  const colorKeywords = ['black', 'white', 'red', 'blue', 'green', 'yellow', 'orange', 'grey', 'gray', 'silver', 'gold', 'beige', 'brown', 'purple', 'pink', 'navy', 'teal'];
  colorKeywords.forEach((color) => {
    if (lower.includes(color)) updates.color.palette.push(color);
  });

  // Use case: "for [use/activity]"
  const useCaseMatch = text.match(/(?:used for|meant for|designed for|intended for)\s+([^,.!?]{6,120})/i);
  if (useCaseMatch) {
    updates.context = { ...(updates.context || {}), useCase: useCaseMatch[1].trim() };
  }

  // Target audience: "for [specific group]" — look for people/role indicators
  const audiencePattern = /\bfor\s+([A-Za-z][A-Za-z0-9\s]{2,60}?(?:players|athletes|kids|children|adults|users|professionals|workers|runners|cyclists|hikers|climbers|swimmers|gamers|students|seniors|women|men|doctors|nurses|engineers|designers|teams|people|beginners|commuters|travelers|artists|musicians|parents|teachers|coaches|fans))/i;
  const audienceMatch = text.match(audiencePattern);
  if (audienceMatch) {
    updates.context = { ...(updates.context || {}), targetAudience: audienceMatch[1].trim() };
  } else if (lower.includes('target audience') || lower.includes('aimed at')) {
    const explicitAudience = text.match(/(?:target audience is|aimed at|designed for)\s+([^,.!?]{4,80})/i);
    if (explicitAudience) updates.context = { ...(updates.context || {}), targetAudience: explicitAudience[1].trim() };
  }

  // Primary function / purpose
  const purposeMatch = text.match(/(?:to help|helps|purpose is to|function is to|it should|it needs to)\s+([^.!?]{8,120})/i);
  if (purposeMatch) {
    updates.purpose = { ...(updates.purpose || {}), primaryFunction: purposeMatch[1].trim() };
  }

  const featureCue = /(must have|feature|include|needs to have)\s+([^.!?]+)/ig;
  let featureMatch;
  while ((featureMatch = featureCue.exec(text)) !== null) {
    const chunks = featureMatch[2].split(/,| and /i).map((x) => x.trim()).filter(Boolean);
    updates.features.core.push(...chunks);
  }

  if (updates.color.palette.length === 0) delete updates.color;
  if (updates.cmft.materials.length === 0) delete updates.cmft;
  if (updates.features.core.length === 0) delete updates.features;
  if (updates.purpose && !updates.purpose.primaryFunction && updates.purpose.goals && updates.purpose.goals.length === 0) delete updates.purpose;

  const hasContent = Object.keys(updates).some(k => k !== 'purpose' || updates[k]);
  if (!hasContent && !updates.productName && !updates.context) {
    updates.generalNotes = text.slice(0, 240);
  }

  return updates;
}

// Extract product information from conversation
async function extractProductInfo(userMessage, aiResponse, currentProductInfo) {
  const baseInfo = mergeProductInfo(getDefaultProductInfo(), currentProductInfo || {});
  const heuristicUpdates = extractProductInfoHeuristic(userMessage);
  let mergedInfo = mergeProductInfo(baseInfo, heuristicUpdates);
  logProductInfoDebug('extractProductInfo.start', {
    userMessage,
    baseInfo: summarizeProductInfo(baseInfo),
    heuristicUpdates: summarizeProductInfo(heuristicUpdates),
    mergedAfterHeuristic: summarizeProductInfo(mergedInfo)
  });

  if (!OPENROUTER_API_KEY) {
    console.log('📝 Product info updated via heuristic extractor (no API key)');
    return mergedInfo;
  }

  try {
    const extractionPrompt = `You are a product design information extractor. Your job is to read the user's message and pull out any product design facts they are communicating — even if stated conversationally.

Key rules:
- If the user says "I want to make/create/design/build a [product]", set productName to that product
- If the user says "for [group of people]" (e.g. "for basketball players", "for kids", "for office workers"), set context.targetAudience
- If the user describes what the product is used for, set context.useCase
- If they mention colors, materials, dimensions, features — capture them
- Do NOT make up details not present in the message
- Do NOT extract anything from the AI assistant's response section below
- Leave fields as empty string or empty array if not mentioned

Examples:
  User: "I want to make a water bottle for basketball players"
  → productName: "water bottle", context.targetAudience: "basketball players", context.useCase: "hydration during basketball"

  User: "I'm designing an ergonomic chair for office workers who sit all day"
  → productName: "ergonomic chair", context.targetAudience: "office workers", context.useCase: "sitting support for long work sessions"

Return ONLY valid JSON with this exact shape:
{
  "productName": "",
  "direction": "",
  "size": { "dimensions": "", "scale": "", "notes": "" },
  "color": { "palette": [], "primary": "", "secondary": "", "notes": "" },
  "form": { "shape": "", "style": "", "aesthetics": "", "notes": "" },
  "context": { "useCase": "", "environment": "", "targetAudience": "", "notes": "" },
  "purpose": { "primaryFunction": "", "problemSolved": "", "goals": [], "notes": "" },
  "cmft": { "certifications": [], "materials": [], "finish": "", "testing": [], "notes": "" },
  "features": { "core": [], "secondary": [], "innovative": [], "notes": "" },
  "generalNotes": ""
}

Current project info (do not repeat fields already filled — only return NEW or UPDATED values):
${JSON.stringify(baseInfo, null, 2)}

User message:
"${userMessage}"

AI response (context only — do NOT extract from this):
"${aiResponse.slice(0, 400)}"

Return only the JSON object, nothing else.`;

    const extractedData = await callOpenRouter([{ role: 'user', content: extractionPrompt }]);
    const parsedData = parseJsonObjectFromText(extractedData);

    if (!parsedData) {
      console.warn('⚠️ Product info extractor returned non-JSON, using heuristic result for this turn.');
      return mergedInfo;
    }

    mergedInfo = mergeProductInfo(mergedInfo, parsedData);
    logProductInfoDebug('extractProductInfo.modelMerged', {
      parsedData: summarizeProductInfo(parsedData),
      mergedInfo: summarizeProductInfo(mergedInfo)
    });
    console.log('📝 Product info extracted and merged');
    return mergedInfo;
  } catch (error) {
    console.error('❌ Failed to extract product info via model, used heuristic fallback:', error.message, error.response?.status);
    logProductInfoDebug('extractProductInfo.modelFallback', {
      mergedInfo: summarizeProductInfo(mergedInfo),
      error: error.message
    });
    return mergedInfo;
  }
}

// Endpoint to get available modes
app.get('/api/modes', (req, res) => {
  res.json({ 
    modes: Object.keys(modes),
    config: modes
  });
});

// Endpoint to get available providers
app.get('/api/providers', (req, res) => {
  res.json({
    providers: ['openrouter'],
    openrouter: !!OPENROUTER_API_KEY,
    model: OPENROUTER_MODEL
  });
});

// Analyze image using Google Cloud Vision API
async function analyzeImageWithVision(imageDataUrl) {
  if (!VISION_API_KEY) {
    throw new Error('Google Cloud Vision API key not configured');
  }

  try {
    // Remove data URL prefix to get base64 content
    const base64Image = imageDataUrl.replace(/^data:image\/\w+;base64,/, '');
    
    const response = await axios.post(
      `https://vision.googleapis.com/v1/images:annotate?key=${VISION_API_KEY}`,
      {
        requests: [
          {
            image: { content: base64Image },
            features: [
              { type: 'LABEL_DETECTION', maxResults: 10 },
              { type: 'TEXT_DETECTION', maxResults: 5 },
              { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
              { type: 'IMAGE_PROPERTIES' }
            ]
          }
        ]
      }
    );

    const result = response.data.responses[0];
    let description = 'Image Analysis:\n\n';

    // Labels
    if (result.labelAnnotations && result.labelAnnotations.length > 0) {
      description += 'Objects/Concepts detected: ';
      description += result.labelAnnotations.map(label => label.description).join(', ');
      description += '\n\n';
    }

    // Text
    if (result.textAnnotations && result.textAnnotations.length > 0) {
      description += 'Text in image: "' + result.textAnnotations[0].description.replace(/\n/g, ' ') + '"\n\n';
    }

    // Objects
    if (result.localizedObjectAnnotations && result.localizedObjectAnnotations.length > 0) {
      description += 'Specific objects: ';
      description += result.localizedObjectAnnotations.map(obj => obj.name).join(', ');
      description += '\n\n';
    }

    // Colors
    if (result.imagePropertiesAnnotation && result.imagePropertiesAnnotation.dominantColors) {
      const colors = result.imagePropertiesAnnotation.dominantColors.colors.slice(0, 3);
      description += 'Dominant colors: ';
      description += colors.map(c => `RGB(${Math.round(c.color.red || 0)}, ${Math.round(c.color.green || 0)}, ${Math.round(c.color.blue || 0)})`).join(', ');
    }

    console.log('📸 Vision API analysis completed');
    return description;
  } catch (error) {
    console.error('❌ Vision API error:', error.response?.data || error.message);
    throw new Error('Failed to analyze image: ' + (error.response?.data?.error?.message || error.message));
  }
}

function normalizeConversationHistory(history) {
  if (!Array.isArray(history)) return [];

  return history
    .map((entry) => {
      const role = entry?.role === 'assistant' ? 'assistant' : (entry?.role === 'user' ? 'user' : null);
      const content = typeof entry?.content === 'string' ? entry.content.trim() : '';
      if (!role || !content) return null;
      return { role, content };
    })
    .filter(Boolean)
    .slice(-12);
}

function buildExtractionUserText(message, conversationHistory) {
  const history = normalizeConversationHistory(conversationHistory)
    .filter((entry) => entry.role === 'user')
    .map((entry) => entry.content);

  const current = String(message || '').trim();
  if (current) history.push(current);

  const deduped = [];
  history.forEach((item) => {
    if (!item) return;
    if (deduped.length === 0 || deduped[deduped.length - 1] !== item) {
      deduped.push(item);
    }
  });

  return deduped.slice(-8).join('\n');
}

async function callMistral(message, systemPrompt = null, conversationHistory = [], options = {}) {
  const messages = [];
  if (systemPrompt) messages.push({ role: 'system', content: systemPrompt });
  messages.push(...normalizeConversationHistory(conversationHistory));
  messages.push({ role: 'user', content: message });
  return callOpenRouter(messages, options);
}

app.post('/api/chat', async (req, res) => {
  try {
    const { message, mode, image, analyze, agents, productInfo, conversationHistory, openrouterModel, strictModel } = req.body;
    logProductInfoDebug('/api/chat.request', {
      mode,
      analyze: !!analyze,
      hasImage: !!image,
      conversationHistoryCount: Array.isArray(conversationHistory) ? conversationHistory.length : 0,
      requestProductInfo: summarizeProductInfo(productInfo)
    });
    
    if (!message && !image) {
      return res.status(400).json({ error: 'Message or image is required' });
    }

    // Use project-specific productInfo from request (not from file)
    const projectContext = productInfo || null;
    
    // Get system prompt for selected mode
    let systemPrompt = mode && modes[mode] ? modes[mode] : null;
    
    // If analyze flag is set, enhance system prompt for critical analysis
    if (analyze && image) {
      const criticalPrompts = {
        ideation: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for ideation. Examine this sketch or concept image thoroughly. Provide honest, constructive criticism covering: 1) Strengths and unique aspects, 2) Weaknesses and unclear elements, 3) Missing considerations or gaps in thinking, 4) Suggestions for improvement and alternative approaches, 5) Potential problems or challenges that may arise. Be direct, specific, and actionable in your feedback. Don't just praise - identify real issues and opportunities.`,
        conceptualization: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for conceptualization. Examine this design or prototype thoroughly. Provide detailed critique covering: 1) Design strengths and innovative elements, 2) Design flaws, usability concerns, or aesthetic issues, 3) Functionality and user experience problems, 4) Technical feasibility concerns, 5) Suggestions for refinement and enhancement. Be professionally critical - point out what works AND what doesn't. Consider both form and function.`,
        execution: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for execution. Examine this implementation, prototype, or final work thoroughly. Provide rigorous evaluation covering: 1) Quality of execution and craftsmanship, 2) Technical issues, bugs, or implementation flaws, 3) Comparison to best practices and industry standards, 4) Performance, maintainability, and scalability concerns, 5) Specific actionable improvements needed. Be thorough and exacting - this is about delivering professional-quality work.`
      };
      systemPrompt = criticalPrompts[mode] || `${systemPrompt || ''} Provide detailed critical analysis of this image. Be thorough, honest, and constructive in identifying both strengths and areas for improvement.`;
      console.log(`🔍 Using CRITICAL ANALYSIS mode: ${mode || 'default'}`);
    } else {
      console.log(`📝 Using mode: ${mode || 'none'}`);
      if (agents && agents.length > 0) {
        console.log(`🤖 Using agents: ${agents.join(', ')}`);
      }
    }
    
    let finalMessage = message;
    let imageAnalysisContext = null;
    
    // If image(s) are present, analyze them with Vision API first
    if (image) {
      const images = Array.isArray(image) ? image : [image];
      console.log(`🖼️ ${images.length} image(s) attached - analyzing with Vision API...`);
      try {
        const analysisPromises = images.map((img, index) => 
          analyzeImageWithVision(img).then(result => `\n\n--- Image ${index + 1} Analysis ---\n${result}`)
        );
        const imageAnalyses = await Promise.all(analysisPromises);
        const combinedAnalysis = imageAnalyses.join('\n');
        imageAnalysisContext = combinedAnalysis;
        
        finalMessage = buildVisionGroundedUserPrompt(combinedAnalysis, message, !!analyze);
      } catch (visionError) {
        console.error('Vision API failed:', visionError.message);
        return res.status(500).json({ 
          error: 'Failed to analyze image: ' + visionError.message 
        });
      }
    }
    
    // Build enhanced prompt with agent context if agents are selected
    if (agents && agents.length > 0) {
      systemPrompt = buildAgentPrompt(systemPrompt, agents, projectContext, imageAnalysisContext);
    } else if (projectContext && Object.keys(projectContext).some(key => projectContext[key] && projectContext[key] !== '')) {
      // Add basic project context even without agents
      systemPrompt = buildAgentPrompt(systemPrompt, [], projectContext, imageAnalysisContext);
    }

    const response = await callMistral(finalMessage, systemPrompt, conversationHistory, {
      model: openrouterModel,
      allowFallback: strictModel ? false : true
    });
    console.log(`✅ Response from Mistral`);
    
    // Extract and update product info from conversation
    let updatedProductInfo = projectContext;
    const extractionUserText = buildExtractionUserText(message, conversationHistory);
    if (extractionUserText) {
      updatedProductInfo = await extractProductInfo(extractionUserText, response, projectContext || {
        productName: '', direction: '',
        size: { dimensions: '', scale: '', notes: '' },
        color: { palette: [], primary: '', secondary: '', notes: '' },
        form: { shape: '', style: '', aesthetics: '', notes: '' },
        context: { useCase: '', environment: '', targetAudience: '', notes: '' },
        purpose: { primaryFunction: '', problemSolved: '', goals: [], notes: '' },
        cmft: { certifications: [], materials: [], finish: '', testing: [], notes: '' },
        features: { core: [], secondary: [], innovative: [], notes: '' },
        generalNotes: ''
      });
    }
    logProductInfoDebug('/api/chat.response', {
      mode: mode || 'default',
      responseLength: response.length,
      responseProductInfo: summarizeProductInfo(updatedProductInfo)
    });
    
    return res.json({ 
      response, 
      provider: 'openrouter', 
      mode: mode || 'default',
      productInfo: updatedProductInfo 
    });
    
  } catch (error) {
    console.error('❌ Error in chat endpoint:', error.message);
    res.status(500).json({ 
      error: 'Failed to get response from AI: ' + error.message
    });
  }
});

app.post('/api/chat/stream', async (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const { message, mode, image, analyze, agents, productInfo, conversationHistory } = req.body;
    logProductInfoDebug('/api/chat/stream.request', {
      mode,
      analyze: !!analyze,
      hasImage: !!image,
      conversationHistoryCount: Array.isArray(conversationHistory) ? conversationHistory.length : 0,
      requestProductInfo: summarizeProductInfo(productInfo)
    });

    if (!message && !image) {
      send({ error: 'Message or image is required' });
      return res.end();
    }

    const projectContext = productInfo || null;
    let systemPrompt = mode && modes[mode] ? modes[mode] : null;

    if (analyze && image) {
      const criticalPrompts = {
        ideation: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for ideation. Examine this sketch or concept image thoroughly. Provide honest, constructive criticism covering: 1) Strengths and unique aspects, 2) Weaknesses and unclear elements, 3) Missing considerations or gaps in thinking, 4) Suggestions for improvement and alternative approaches, 5) Potential problems or challenges that may arise. Be direct, specific, and actionable in your feedback.`,
        conceptualization: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for conceptualization. Examine this design or prototype thoroughly. Provide detailed critique covering: 1) Design strengths and innovative elements, 2) Design flaws, usability concerns, or aesthetic issues, 3) Functionality and user experience problems, 4) Technical feasibility concerns, 5) Suggestions for refinement and enhancement.`,
        execution: `${systemPrompt || ''} You are now in CRITICAL ANALYSIS mode for execution. Examine this implementation thoroughly. Provide rigorous evaluation covering: 1) Quality of execution and craftsmanship, 2) Technical issues, bugs, or implementation flaws, 3) Comparison to best practices and industry standards, 4) Performance, maintainability, and scalability concerns, 5) Specific actionable improvements needed.`
      };
      systemPrompt = criticalPrompts[mode] || `${systemPrompt || ''} Provide detailed critical analysis of this image.`;
    }

    let finalMessage = message;
    let imageAnalysisContext = null;

    if (image) {
      const images = Array.isArray(image) ? image : [image];
      try {
        const analyses = await Promise.all(
          images.map((img, i) => analyzeImageWithVision(img).then(r => `\n\n--- Image ${i + 1} Analysis ---\n${r}`))
        );
        imageAnalysisContext = analyses.join('\n');
        finalMessage = buildVisionGroundedUserPrompt(imageAnalysisContext, message, !!analyze);
      } catch (e) {
        send({ error: 'Failed to analyze image: ' + e.message });
        return res.end();
      }
    }

    if (agents && agents.length > 0) {
      systemPrompt = buildAgentPrompt(systemPrompt, agents, projectContext, imageAnalysisContext);
    } else if (projectContext && Object.keys(projectContext).some(k => projectContext[k] && projectContext[k] !== '')) {
      systemPrompt = buildAgentPrompt(systemPrompt, [], projectContext, imageAnalysisContext);
    }

    const msgs = [];
    if (systemPrompt) msgs.push({ role: 'system', content: systemPrompt });
    msgs.push(...normalizeConversationHistory(conversationHistory));
    msgs.push({ role: 'user', content: finalMessage });

    let fullResponse = '';
    try {
      fullResponse = await callOpenRouterStream(msgs, send);
      console.log(`✅ Streamed response (${fullResponse.length} chars)`);
    } catch (streamError) {
      const status = streamError?.response?.status || 'unknown';
      console.warn(`⚠️ Streaming failed (${status}). Falling back to non-stream response.`);
      fullResponse = await callOpenRouter(msgs);
      if (fullResponse) {
        // Keep SSE contract intact so the frontend can render and persist response.
        send({ token: fullResponse });
      }
    }

    let updatedProductInfo = projectContext;
    const extractionUserText = buildExtractionUserText(message, conversationHistory);
    if (extractionUserText) {
      updatedProductInfo = await extractProductInfo(extractionUserText, fullResponse, projectContext || {
        productName: '', direction: '',
        size: { dimensions: '', scale: '', notes: '' },
        color: { palette: [], primary: '', secondary: '', notes: '' },
        form: { shape: '', style: '', aesthetics: '', notes: '' },
        context: { useCase: '', environment: '', targetAudience: '', notes: '' },
        purpose: { primaryFunction: '', problemSolved: '', goals: [], notes: '' },
        cmft: { certifications: [], materials: [], finish: '', testing: [], notes: '' },
        features: { core: [], secondary: [], innovative: [], notes: '' },
        generalNotes: ''
      });
    }

    logProductInfoDebug('/api/chat/stream.done', {
      mode: mode || 'default',
      responseLength: fullResponse.length,
      responseProductInfo: summarizeProductInfo(updatedProductInfo)
    });

    send({ done: true, provider: 'openrouter', mode: mode || 'default', productInfo: updatedProductInfo });
    res.end();

  } catch (error) {
    console.error('\u274c Streaming error:', error.message);
    send({ error: error.message });
    res.end();
  }
});

// ==================== TEXT-TO-SPEECH (Kokoro) ====================
let kokoroTTS = null;

async function getKokoroTTS() {
  if (!kokoroTTS) {
    console.log('🔊 Loading Kokoro TTS model (first run may take a moment)...');
    const { KokoroTTS } = await import('kokoro-js');
    kokoroTTS = await KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
      dtype: 'q8',
      device: 'cpu',
    });
    console.log('✅ Kokoro TTS ready');
  }
  return kokoroTTS;
}

function encodeWAV(samples, sampleRate) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + samples.length * 2, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20);  // PCM
  buf.writeUInt16LE(1, 22);  // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    buf.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
  }
  return buf;
}

app.post('/api/tts', async (req, res) => {
  try {
    const { text, voice = 'af_heart' } = req.body;
    if (!text) return res.status(400).json({ error: 'text is required' });

    const tts = await getKokoroTTS();
    const audio = await tts.generate(text, { voice });
    const wavBuffer = encodeWAV(audio.audio, audio.sampling_rate);

    res.set('Content-Type', 'audio/wav');
    res.set('Content-Length', wavBuffer.length);
    res.send(wavBuffer);
  } catch (error) {
    console.error('❌ TTS error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ==================== IMAGE GENERATION (Runware) ====================
const RUNWARE_API_KEY = process.env.RUNWARE_API_KEY || '';
const RUNWARE_IMAGE_MODEL = process.env.RUNWARE_IMAGE_MODEL || 'openai:4@1';
const RUNWARE_IMAGE_WIDTH = 1024;
const RUNWARE_IMAGE_HEIGHT = 1024;

if (RUNWARE_API_KEY) {
  console.log('✅ Runware API key found');
  console.log(`🖼️ Runware image model: ${RUNWARE_IMAGE_MODEL} (${RUNWARE_IMAGE_WIDTH}x${RUNWARE_IMAGE_HEIGHT})`);
} else {
  console.error('❌ No RUNWARE_API_KEY found. Please add it to your .env file');
}

function extractRunwareError(msg) {
  if (!msg || typeof msg !== 'object') return '';
  if (Array.isArray(msg.errors) && msg.errors.length > 0) {
    const first = msg.errors[0];
    if (first && typeof first === 'object') {
      return String(first.message || first.error || first.code || '').trim();
    }
    return String(msg.errors[0] || '').trim();
  }
  const direct = [msg.errorMessage, msg.message, msg.error, msg.reason].find(Boolean);
  if (typeof direct === 'string') return direct;
  if (direct && typeof direct === 'object') {
    return String(direct.message || direct.error || JSON.stringify(direct));
  }
  return '';
}

function isLikelyCreditError(text) {
  if (!text) return false;
  const t = String(text).toLowerCase();
  return t.includes('insufficient') || t.includes('credit') || t.includes('balance') || t.includes('quota') || t.includes('billing');
}

function isUUIDv4(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value.trim());
}

function isOpenAIImageModel(modelId) {
  return typeof modelId === 'string' && modelId.trim().toLowerCase().startsWith('openai:');
}

function generateRunwareImage(prompt, options = {}) {
  return new Promise((resolve, reject) => {
    if (!RUNWARE_API_KEY) {
      reject(new Error('Runware API key is missing. Set RUNWARE_API_KEY in .env'));
      return;
    }

    const ws = new WebSocket('wss://ws-api.runware.ai/v1');
    const taskUUID = crypto.randomUUID();
    const seedImageInput = typeof options.seedImage === 'string' ? options.seedImage.trim() : '';
    const useReferenceImagesI2I = Boolean(seedImageInput) && isOpenAIImageModel(RUNWARE_IMAGE_MODEL);
    let done = false;
    let authSeen = false;
    let inferenceSent = false;
    let uploadSent = false;
    let uploadTaskUUID = null;
    let uploadedSeedImageUUID = null;
    let messageCount = 0;
    let lastPayloadPreview = '';

    const sendInference = () => {
      if (inferenceSent || done) return;

      // GPT Image models on Runware use inputs.referenceImages for i2i.
      if (useReferenceImagesI2I) {
        inferenceSent = true;
        const inferencePayload = {
          taskType: 'imageInference',
          taskUUID,
          positivePrompt: prompt,
          model: RUNWARE_IMAGE_MODEL,
          width: RUNWARE_IMAGE_WIDTH,
          height: RUNWARE_IMAGE_HEIGHT,
          numberResults: 1,
          outputFormat: 'WEBP',
          inputs: {
            referenceImages: [seedImageInput]
          }
        };

        ws.send(JSON.stringify([inferencePayload]));
        return;
      }

      if (seedImageInput) {
        if (isUUIDv4(seedImageInput)) {
          uploadedSeedImageUUID = seedImageInput;
        } else if (!uploadedSeedImageUUID) {
          if (uploadSent) return;
          uploadSent = true;
          uploadTaskUUID = crypto.randomUUID();
          ws.send(JSON.stringify([{ taskType: 'imageUpload', taskUUID: uploadTaskUUID, image: seedImageInput }]));
          return;
        }
      }

      inferenceSent = true;
      const inferencePayload = {
        taskType: 'imageInference',
        taskUUID,
        positivePrompt: prompt,
        model: RUNWARE_IMAGE_MODEL,
        width: RUNWARE_IMAGE_WIDTH,
        height: RUNWARE_IMAGE_HEIGHT,
        numberResults: 1,
        outputFormat: 'WEBP'
      };

      if (uploadedSeedImageUUID) {
        inferencePayload.seedImage = uploadedSeedImageUUID;
      }

      ws.send(JSON.stringify([inferencePayload]));
    };

    const timeout = setTimeout(() => {
      if (!done) {
        done = true;
        ws.close();
        const details = `messages=${messageCount}, authSeen=${authSeen}, inferenceSent=${inferenceSent}, lastPayload=${lastPayloadPreview || 'none'}`;
        reject(new Error(`Runware API timeout (${details})`));
      }
    }, 90000);

    ws.on('open', () => {
      ws.send(JSON.stringify([{ taskType: 'authentication', apiKey: RUNWARE_API_KEY }]));
    });

    ws.on('message', (data) => {
      messageCount += 1;
      try {
        const raw = data.toString();
        lastPayloadPreview = raw.length > 300 ? `${raw.slice(0, 300)}...` : raw;
      } catch {
        lastPayloadPreview = '[unprintable payload]';
      }

      let messages;
      try { messages = JSON.parse(data.toString()); } catch { return; }
      if (!Array.isArray(messages)) messages = [messages];

      for (const msg of messages) {
        const candidates = [msg, ...(Array.isArray(msg.data) ? msg.data : msg.data ? [msg.data] : [])];

        for (const item of candidates) {
          if (!item || typeof item !== 'object') continue;

          const errText = extractRunwareError(item) || extractRunwareError(msg);
          if (errText) {
            const finalMessage = isLikelyCreditError(errText)
              ? `Runware billing/credits issue: ${errText}`
              : `Runware error: ${errText}`;
            if (!done) { done = true; clearTimeout(timeout); ws.close(); reject(new Error(finalMessage)); }
            return;
          }

          if (
            item.taskType === 'authentication' &&
            (
              item.authenticated === true ||
              item.status === 'authenticated' ||
              item.success === true ||
              Boolean(item.connectionSessionUUID)
            )
          ) {
            authSeen = true;
            sendInference();
            continue;
          }

          if (
            uploadTaskUUID &&
            item.taskType === 'imageUpload' &&
            item.taskUUID === uploadTaskUUID &&
            typeof item.imageUUID === 'string' &&
            item.imageUUID
          ) {
            uploadedSeedImageUUID = item.imageUUID;
            sendInference();
            continue;
          }

          // Support several possible image result shapes.
          const imageUrl = item.imageURL || item.imageUrl || item.url;
          if (item.taskUUID === taskUUID && imageUrl) {
            if (!done) { done = true; clearTimeout(timeout); ws.close(); resolve(imageUrl); }
            return;
          }

          if (item.taskUUID === taskUUID && item.status && String(item.status).toLowerCase() === 'failed') {
            if (!done) { done = true; clearTimeout(timeout); ws.close(); reject(new Error(`Runware inference failed: ${extractRunwareError(item) || 'Unknown failure'}`)); }
            return;
          }
        }

        // Backward-compatible checks on the top-level message.
        if (
          msg.taskType === 'authentication' &&
          (
            msg.authenticated === true ||
            msg.status === 'authenticated' ||
            msg.success === true ||
            Boolean(msg.connectionSessionUUID)
          )
        ) {
          authSeen = true;
          sendInference();
        } else if (
          uploadTaskUUID &&
          msg.taskType === 'imageUpload' &&
          msg.taskUUID === uploadTaskUUID &&
          typeof msg.imageUUID === 'string' &&
          msg.imageUUID
        ) {
          uploadedSeedImageUUID = msg.imageUUID;
          sendInference();
        } else if (msg.taskUUID === taskUUID && (msg.imageURL || msg.imageUrl || msg.url)) {
          if (!done) { done = true; clearTimeout(timeout); ws.close(); resolve(msg.imageURL || msg.imageUrl || msg.url); }
          return;
        } else if (msg.error || msg.taskType === 'error') {
          const errText = extractRunwareError(msg) || 'Runware error';
          const finalMessage = isLikelyCreditError(errText)
            ? `Runware billing/credits issue: ${errText}`
            : `Runware error: ${errText}`;
          if (!done) { done = true; clearTimeout(timeout); ws.close(); reject(new Error(finalMessage)); }
          return;
        }
      }
    });

    ws.on('error', (err) => {
      if (!done) { done = true; clearTimeout(timeout); reject(err); }
    });

    ws.on('close', (code) => {
      if (!done) {
        done = true;
        clearTimeout(timeout);
        reject(new Error(`Runware websocket closed unexpectedly (code ${code})`));
      }
    });
  });
}

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, productInfo, seedImage } = req.body;
    if (!prompt) return res.status(400).json({ error: 'prompt is required' });

    const finalPrompt = buildImagePromptWithProjectInfo(prompt, productInfo);

    const runwareI2IMode = seedImage
      ? (isOpenAIImageModel(RUNWARE_IMAGE_MODEL) ? 'inputs.referenceImages' : 'seedImage/imageUpload')
      : 'text-to-image';

    console.log(`🎨 Generating image via Runware (${RUNWARE_IMAGE_MODEL}, ${RUNWARE_IMAGE_WIDTH}x${RUNWARE_IMAGE_HEIGHT}, i2iMode=${runwareI2IMode}, seedImage=${seedImage ? 'yes' : 'no'}):`, prompt.slice(0, 60));
    let imageURL;
    try {
      imageURL = await generateRunwareImage(finalPrompt, {
        seedImage: seedImage || undefined
      });
    } catch (err) {
      const errorText = String(err?.message || '').toLowerCase();
      const seedUnsupported = errorText.includes('unsupported') && errorText.includes('seedimage');
      if (seedImage && seedUnsupported) {
        throw new Error(`Selected model (${RUNWARE_IMAGE_MODEL}) does not support seedImage. Input image was not used. Choose an image-to-image compatible model.`);
      }
      throw err;
    }

    // Proxy the image bytes back to the client
    const imgRes = await axios.get(imageURL, {
      responseType: 'arraybuffer',
      timeout: 30000,
      headers: { 'Accept': 'image/*' }
    });

    const contentType = imgRes.headers['content-type'] || 'image/webp';
    res.set('Content-Type', contentType);
    res.set('Cache-Control', 'no-cache');
    res.send(Buffer.from(imgRes.data));
    console.log('✅ Image delivered:', Math.round(imgRes.data.byteLength / 1024), 'KB');
  } catch (err) {
    console.error('❌ Image generation error:', err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});