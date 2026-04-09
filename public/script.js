const messageInput = document.getElementById('messageInput');
const sendButton = document.getElementById('sendButton');
const chatMessages = document.getElementById('chatMessages');
const modeButton = document.getElementById('modeButton');
const modePopup = document.getElementById('modePopup');
const currentModeDisplay = document.getElementById('currentMode');
const agentButton = document.getElementById('agentButton');
const agentPopup = document.getElementById('agentPopup');
const agentCount = document.getElementById('agentCount');
const imageButton = document.getElementById('imageButton');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const micButton = document.getElementById('micButton');
const projectsScroll = document.getElementById('projectsScroll');
const chatThreadMenuBtn = document.getElementById('chatThreadMenuBtn');
const chatThreadMenu = document.getElementById('chatThreadMenu');
const chatThreadList = document.getElementById('chatThreadList');
const newChatBtn = document.getElementById('newChatBtn');
const projectSwitcherBtn = document.getElementById('projectSwitcherBtn');
const projectSwitcherMenu = document.getElementById('projectSwitcherMenu');
const psmList = document.getElementById('psmList');
const eyeBtn = document.getElementById('eyeBtn');
const visualModeBtn = imageButton;
const chatWindowEl = document.getElementById('chatWindow');
const chatDropOverlay = document.getElementById('chatDropOverlay');

let isTyping = false;
let availableModes = [];
let selectedMode = 'ideation';
let selectedAgents = [];
let selectedImages = [];
let isRecording = false;
let recognition = null;
let screenCaptureActive = false;
let screenCaptureStream = null;
let finalTranscript = '';
let projects = [];
let currentProjectId = null;
let currentChatId = null;
const CHAT_TEXT_MIME_TYPE = 'application/x-simplechatbot-chat-text';
const CHAT_IMAGE_MIME_TYPE = 'application/x-simplechatbot-chat-image';
const CHAT_STORAGE_KEY = 'chatProjects';
const STORAGE_RESET_VERSION_KEY = 'chatStorageResetVersion';
const STORAGE_RESET_VERSION = '2026-04-02-image-compression-v1';
const MAX_STORED_IMAGE_DIMENSION = 1024;
const DEFAULT_STORED_IMAGE_QUALITY = 0.72;
const MIN_STORED_IMAGE_QUALITY = 0.45;
const MAX_STORED_IMAGE_DATA_URL_CHARS = 180000;
const MAX_STORED_MESSAGES_PER_CHAT = 30;
const MAX_CONTEXT_MESSAGES_FOR_REQUEST = 12;
const PRODUCT_INFO_DEBUG = true;
const pendingAutofillFieldsByProject = new Map();

function summarizeProductInfo(info) {
    if (!info || typeof info !== 'object') {
        return { hasData: false };
    }
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

function revealAutofilledFields(fieldIds) {
    const ids = Array.isArray(fieldIds) ? fieldIds.filter(Boolean) : [];
    if (ids.length === 0) return;

    let firstField = null;
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!firstField) firstField = el;
        el.classList.remove('field-autofilled');
        void el.offsetWidth; // force reflow to restart animation
        el.classList.add('field-autofilled');
        setTimeout(() => el.classList.remove('field-autofilled'), 1800);
    });

    if (firstField) {
        firstField.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
}

function getProjectInfoField(id) {
    if (!projectInfoView) return document.getElementById(id);
    const inPanel = projectInfoView.querySelector(`#${id}`);
    return inPanel || document.getElementById(id);
}

function mergeProductInfoClient(baseInfo, updates) {
    const merged = JSON.parse(JSON.stringify(baseInfo || {}));
    if (!updates || typeof updates !== 'object') return merged;

    function mergeField(target, source, key) {
        const value = source[key];
        if (value === undefined || value === null || value === '') return;

        if (Array.isArray(value)) {
            if (value.length > 0) target[key] = [...value];
            return;
        }

        if (typeof value === 'object') {
            if (!target[key] || typeof target[key] !== 'object' || Array.isArray(target[key])) {
                target[key] = {};
            }
            Object.keys(value).forEach((subKey) => mergeField(target[key], value, subKey));
            return;
        }

        target[key] = value;
    }

    Object.keys(updates).forEach((key) => mergeField(merged, updates, key));
    return merged;
}

// Context menu variables
const projectContextMenu = document.getElementById('projectContextMenu');
let contextMenuProjectId = null;
const topIndicatorBar = document.getElementById('topIndicatorBar');

function getCurrentProject() {
    return projects.find(p => p.id === currentProjectId) || null;
}

function ensureProjectChats(project) {
    if (!project) return;

    if (!Array.isArray(project.chats) || project.chats.length === 0) {
        const existingMessages = Array.isArray(project.messages) ? project.messages : [];
        const now = project.modified || project.created || new Date().toISOString();
        project.chats = [{
            id: Date.now() + Math.floor(Math.random() * 1000),
            title: 'Chat 1',
            messages: existingMessages,
            created: now,
            modified: now
        }];
    }

    if (!project.currentChatId || !project.chats.some(chat => chat.id === project.currentChatId)) {
        project.currentChatId = project.chats[0].id;
    }

    if (!Array.isArray(project.messages)) {
        project.messages = project.chats.find(chat => chat.id === project.currentChatId)?.messages || [];
    }
}

function getCurrentChat(project = getCurrentProject()) {
    if (!project) return null;
    ensureProjectChats(project);
    return project.chats.find(chat => chat.id === project.currentChatId) || project.chats[0] || null;
}

function getConversationHistoryForRequest(pendingUserMessage = '') {
    const chat = getCurrentChat();
    if (!chat || !Array.isArray(chat.messages)) return [];

    const history = chat.messages
        .filter((msg) => msg && typeof msg.content === 'string' && msg.content.trim())
        .map((msg) => ({
            role: msg.role === 'bot' ? 'assistant' : (msg.role === 'user' ? 'user' : null),
            content: msg.content.trim()
        }))
        .filter((msg) => msg.role && msg.content);

    const pending = String(pendingUserMessage || '').trim();
    if (pending && history.length > 0) {
        const last = history[history.length - 1];
        if (last.role === 'user' && last.content === pending) {
            history.pop();
        }
    }

    return history.slice(-MAX_CONTEXT_MESSAGES_FOR_REQUEST);
}

function getChatPreview(chat) {
    const lastMessage = [...(chat.messages || [])].reverse().find(msg => (msg.content || '').trim());
    if (!lastMessage) return 'No messages yet';
    return `${lastMessage.role === 'user' ? 'You' : 'AI'}: ${lastMessage.content.replace(/\s+/g, ' ').trim()}`;
}

function closeChatThreadMenu() {
    if (!chatThreadMenu) return;
    chatThreadMenu.classList.remove('show');
}

function estimateDataUrlBytes(dataUrl) {
    if (typeof dataUrl !== 'string') return 0;
    const commaIndex = dataUrl.indexOf(',');
    if (commaIndex < 0) return 0;
    const base64Length = dataUrl.length - commaIndex - 1;
    return Math.floor((base64Length * 3) / 4);
}

function isDataImageUrl(value) {
    return typeof value === 'string' && value.startsWith('data:image/');
}

async function loadImageFromDataUrl(dataUrl) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error('Failed to decode image data'));
        img.src = dataUrl;
    });
}

async function compressDataUrlForStorage(dataUrl, options = {}) {
    if (!isDataImageUrl(dataUrl)) return dataUrl;
    const maxDimension = options.maxDimension || MAX_STORED_IMAGE_DIMENSION;
    const maxChars = options.maxChars || MAX_STORED_IMAGE_DATA_URL_CHARS;
    const initialQuality = options.initialQuality || DEFAULT_STORED_IMAGE_QUALITY;
    const minQuality = options.minQuality || MIN_STORED_IMAGE_QUALITY;

    if (dataUrl.length <= maxChars && estimateDataUrlBytes(dataUrl) < 250000) {
        return dataUrl;
    }

    try {
        const img = await loadImageFromDataUrl(dataUrl);
        const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth || 1, img.naturalHeight || 1));
        const width = Math.max(1, Math.round((img.naturalWidth || 1) * scale));
        const height = Math.max(1, Math.round((img.naturalHeight || 1) * scale));

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return dataUrl;
        ctx.drawImage(img, 0, 0, width, height);

        let quality = initialQuality;
        let compressed = canvas.toDataURL('image/jpeg', quality);

        while (compressed.length > maxChars && quality > minQuality) {
            quality = Math.max(minQuality, quality - 0.07);
            compressed = canvas.toDataURL('image/jpeg', quality);
            if (quality === minQuality) break;
        }

        return compressed.length < dataUrl.length ? compressed : dataUrl;
    } catch {
        return dataUrl;
    }
}

async function compressImageMetaForStorage(imageValue) {
    if (!imageValue) return imageValue;

    if (Array.isArray(imageValue)) {
        const compressedList = [];
        for (const entry of imageValue) {
            compressedList.push(await compressDataUrlForStorage(entry));
        }
        return compressedList;
    }

    return compressDataUrlForStorage(imageValue);
}

async function persistMessageToProject(role, content, messageMeta = {}) {
    const messageMetaForStorage = { ...messageMeta };
    if (messageMetaForStorage.imageUrl) {
        messageMetaForStorage.imageUrl = await compressImageMetaForStorage(messageMetaForStorage.imageUrl);
    }
    saveMessageToProject(role, content, messageMetaForStorage);
}

function renderChatThreadMenu() {
    if (!chatThreadList) return;

    const project = getCurrentProject();
    if (!project) {
        chatThreadList.innerHTML = '<div class="chat-thread-empty">No active project.</div>';
        return;
    }

    ensureProjectChats(project);

    const recentChats = [...project.chats]
        .sort((a, b) => new Date(b.modified || b.created).getTime() - new Date(a.modified || a.created).getTime())
        .slice(0, 5);

    chatThreadList.innerHTML = '';

    if (recentChats.length === 0) {
        const empty = document.createElement('div');
        empty.className = 'chat-thread-empty';
        empty.textContent = 'No recent chats yet.';
        chatThreadList.appendChild(empty);
        return;
    }

    recentChats.forEach(chat => {
        const item = document.createElement('button');
        item.type = 'button';
        item.className = 'chat-thread-item';
        if (chat.id === currentChatId) item.classList.add('active');

        const modified = new Date(chat.modified || chat.created);
        const messageCount = chat.messages?.length || 0;

        item.innerHTML = `
            <span class="chat-thread-title">${chat.title}</span>
            <span class="chat-thread-meta">${messageCount} messages · ${formatDate(modified)}</span>
            <span class="chat-thread-preview">${getChatPreview(chat)}</span>
        `;

        item.addEventListener('click', () => {
            project.currentChatId = chat.id;
            currentChatId = chat.id;
            renderCurrentChatMessages();
            saveProjects();
            closeChatThreadMenu();
        });

        chatThreadList.appendChild(item);
    });
}

function createNewChatInCurrentProject() {
    const project = getCurrentProject();
    if (!project) return;

    ensureProjectChats(project);
    const nextIndex = (project.chats?.length || 0) + 1;
    const now = new Date().toISOString();
    const chat = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        title: `Chat ${nextIndex}`,
        messages: [],
        created: now,
        modified: now
    };

    project.chats.unshift(chat);
    project.currentChatId = chat.id;
    currentChatId = chat.id;
    project.modified = now;

    renderCurrentChatMessages();
    saveProjects();
    renderProjects();
    renderChatThreadMenu();
}

function renderCurrentChatMessages() {
    const project = getCurrentProject();
    const chat = getCurrentChat(project);
    if (!project || !chat || !chatMessages) return;

    currentChatId = chat.id;
    project.currentChatId = chat.id;
    project.messages = chat.messages;

    chatMessages.innerHTML = '';
    chat.messages.forEach(msg => {
        renderMessageToChat(
            {
                role: msg.role,
                content: msg.content,
                provider: msg.provider,
                mode: msg.mode,
                imageUrl: msg.imageUrl
            },
            {
                persist: false,
                skipFade: true,
                suppressNotification: true
            }
        );
    });

    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Show projects menu on hover at top of page
const projectsMenuElement = document.getElementById('projectsMenu');
let projectsMenuTimer;
let isProjectsMenuPinned = false;

function openProjectsMenu() {
    clearTimeout(projectsMenuTimer);
    projectsMenuElement.classList.add('show');
    topIndicatorBar.classList.add('hide');
}

function closeProjectsMenu({ force = false } = {}) {
    if (isProjectsMenuPinned && !force) return;
    clearTimeout(projectsMenuTimer);
    projectsMenuElement.classList.remove('show');
    topIndicatorBar.classList.remove('hide');
}

document.addEventListener('mousemove', (e) => {
    if (isProjectsMenuPinned) return;

    if (e.clientY < 50) {
        openProjectsMenu();
    } else if (e.clientY > 200) {
        projectsMenuTimer = setTimeout(() => {
            if (!projectsMenuElement.matches(':hover') && !isProjectsMenuPinned) {
                closeProjectsMenu();
            }
        }, 300);
    }
});

projectsMenuElement.addEventListener('mouseenter', () => {
    openProjectsMenu();
});

projectsMenuElement.addEventListener('mouseleave', () => {
    projectsMenuTimer = setTimeout(() => {
        if (!isProjectsMenuPinned) closeProjectsMenu();
    }, 300);
});

function renderProjectSwitcherMenu() {
    if (!psmList) return;
    psmList.innerHTML = '';
    projects.forEach(project => {
        const btn = document.createElement('button');
        btn.className = 'psm-item' + (project.id === currentProjectId ? ' active' : '');
        btn.textContent = project.title;
        btn.addEventListener('click', () => { loadProject(project.id); closeProjectSwitcherMenu(); });
        psmList.appendChild(btn);
    });
    const newBtn = document.createElement('button');
    newBtn.className = 'psm-item psm-new';
    newBtn.textContent = '+ New Project';
    newBtn.addEventListener('click', () => { createNewProject(); closeProjectSwitcherMenu(); });
    psmList.appendChild(newBtn);
}

function openProjectSwitcherMenu() {
    renderProjectSwitcherMenu();
    projectSwitcherMenu.classList.add('show');
    projectSwitcherBtn.classList.add('active');
}

function closeProjectSwitcherMenu() {
    projectSwitcherMenu.classList.remove('show');
    projectSwitcherBtn.classList.remove('active');
}

if (projectSwitcherBtn) {
    projectSwitcherBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (projectSwitcherMenu.classList.contains('show')) {
            closeProjectSwitcherMenu();
        } else {
            openProjectSwitcherMenu();
        }
    });
}

// Context menu handlers
document.addEventListener('click', (e) => {
    if (
        projectsMenuElement &&
        !projectsMenuElement.contains(e.target)
    ) {
        isProjectsMenuPinned = false;
        closeProjectsMenu({ force: true });
    }

    if (
        projectSwitcherMenu &&
        projectSwitcherMenu.classList.contains('show') &&
        !projectSwitcherMenu.contains(e.target) &&
        !projectSwitcherBtn.contains(e.target)
    ) {
        closeProjectSwitcherMenu();
    }

    if (!projectContextMenu.contains(e.target)) {
        projectContextMenu.classList.remove('show');
    }

    if (
        chatThreadMenu &&
        chatThreadMenuBtn &&
        !chatThreadMenu.contains(e.target) &&
        !chatThreadMenuBtn.contains(e.target)
    ) {
        closeChatThreadMenu();
    }
});

if (chatThreadMenuBtn) {
    chatThreadMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        renderChatThreadMenu();
        chatThreadMenu.classList.toggle('show');
    });
}

if (newChatBtn) {
    newChatBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        createNewChatInCurrentProject();
    });
}

document.getElementById('renameProject').addEventListener('click', () => {
    const project = projects.find(p => p.id === contextMenuProjectId);
    if (project) {
        const newName = prompt('Enter new project name:', project.title);
        if (newName && newName.trim()) {
            project.title = newName.trim();
            project.modified = new Date().toISOString();
            saveProjects();
            renderProjects();
        }
    }
    projectContextMenu.classList.remove('show');
});

document.getElementById('deleteProject').addEventListener('click', () => {
    const project = projects.find(p => p.id === contextMenuProjectId);
    if (project) {
        if (confirm(`Are you sure you want to delete "${project.title}"?`)) {
            projects = projects.filter(p => p.id !== contextMenuProjectId);
            
            // If deleting current project, switch to another or create new
            if (currentProjectId === contextMenuProjectId) {
                if (projects.length > 0) {
                    loadProject(projects[0].id);
                } else {
                    createNewProject();
                }
            }
            
            saveProjects();
            renderProjects();
        }
    }
    projectContextMenu.classList.remove('show');
});

function showContextMenu(e, projectId) {
    e.preventDefault();
    e.stopPropagation();
    
    contextMenuProjectId = projectId;
    projectContextMenu.classList.add('show');
    
    // Position the context menu
    const x = e.clientX;
    const y = e.clientY;
    
    projectContextMenu.style.left = `${x}px`;
    projectContextMenu.style.top = `${y}px`;
    
    // Adjust if menu goes off screen
    setTimeout(() => {
        const rect = projectContextMenu.getBoundingClientRect();
        if (rect.right > window.innerWidth) {
            projectContextMenu.style.left = `${window.innerWidth - rect.width - 10}px`;
        }
        if (rect.bottom > window.innerHeight) {
            projectContextMenu.style.top = `${window.innerHeight - rect.height - 10}px`;
        }
    }, 0);
}

// Initialize speech recognition
if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';
    
    recognition.onstart = () => {
        isRecording = true;
        micButton.classList.add('recording');
        finalTranscript = messageInput.value; // Keep existing text
        console.log('🎤 Recording started');
    };
    
    recognition.onresult = (event) => {
        let interimTranscript = '';
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
                finalTranscript += transcript + ' ';
            } else {
                interimTranscript += transcript;
            }
        }
        
        // Update input with finalized text + interim text
        messageInput.value = finalTranscript + interimTranscript;
    };
    
    recognition.onend = () => {
        // Only stop if user manually stopped it
        if (isRecording) {
            // Restart if it ended unexpectedly
            try {
                recognition.start();
            } catch (e) {
                isRecording = false;
                micButton.classList.remove('recording');
            }
        } else {
            micButton.classList.remove('recording');
            finalTranscript = ''; // Reset when stopped
            console.log('🎤 Recording stopped');
        }
    };
    
    recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'no-speech') {
            // Continue listening even if no speech detected
            return;
        }
        isRecording = false;
        micButton.classList.remove('recording');
        finalTranscript = '';
        if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access to use voice input.');
        }
    };
} else {
    console.warn('Speech recognition not supported in this browser');
}

// Check available modes on page load
async function checkAvailableModes() {
    try {
        const modesResponse = await fetch('/api/modes');
        const modesData = await modesResponse.json();
        
        availableModes = modesData.modes || [];
        updateModeOptions();
        
        console.log('Available modes:', availableModes);
    } catch (error) {
        console.error('Failed to check modes:', error);
    }
}

function updateModeOptions() {
    // Set active mode option
    document.querySelectorAll('.mode-option').forEach(option => {
        if (option.dataset.mode === selectedMode) {
            option.classList.add('active');
        } else {
            option.classList.remove('active');
        }
    });
    
    // Update button text
    const modeNames = {
        'ideation': 'Ideation',
        'conceptualization': 'Conceptualization',
        'execution': 'Execution'
    };
    currentModeDisplay.textContent = modeNames[selectedMode] || selectedMode;
}

function normalizeImageUrls(imageUrl) {
    if (!imageUrl) return [];
    return Array.isArray(imageUrl) ? imageUrl.filter(Boolean) : [imageUrl];
}

function renderMessageToChat(message, options = {}) {
    const {
        persist = false,
        skipFade = false,
        suppressNotification = false
    } = options;

    const role = message.role || 'bot';
    const isUser = role === 'user';
    const content = message.content || '';
    const provider = message.provider || null;
    const mode = message.mode || null;
    const imageUrls = normalizeImageUrls(message.imageUrl);

    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user-message' : 'bot-message'}`;

    if (!isUser && imageUrls.length > 0) {
        messageDiv.classList.add('generated-image-msg');
    }

    // Add fade-in animation class for new bot messages.
    if (!isUser && !skipFade) {
        messageDiv.classList.add('fade-in-message');

        const chatWindow = document.getElementById('chatWindow');
        if (!suppressNotification && chatWindow && chatWindow.classList.contains('minimized')) {
            showNotificationDot();
        }
    }

    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';

    if (!isUser && (provider || mode)) {
        let badges = '';
        if (mode) badges += `<span style="background: #9c27b0; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px;">${mode.toUpperCase()}</span>`;
        if (provider) badges += `<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${provider.toUpperCase()}</span>`;
        const markdownContent = content ? marked.parse(content) : '';
        messageContent.innerHTML = `<div style="margin-bottom: 5px;">${badges}</div>${markdownContent}`;
    } else if (!isUser && content) {
        messageContent.innerHTML = marked.parse(content);
    } else if (isUser) {
        if (imageUrls.length > 0) {
            if (imageUrls.length > 1) {
                const imageGrid = document.createElement('div');
                imageGrid.className = 'message-image-grid';
                imageUrls.forEach(url => {
                    const img = document.createElement('img');
                    img.src = url;
                    img.className = 'message-image';
                    imageGrid.appendChild(img);
                });
                messageContent.appendChild(imageGrid);
            } else {
                const img = document.createElement('img');
                img.src = imageUrls[0];
                img.className = 'message-image';
                messageContent.appendChild(img);
            }
        }
        if (content) {
            const textDiv = document.createElement('div');
            textDiv.textContent = content;
            messageContent.appendChild(textDiv);
        }
    }

    if (!isUser && imageUrls.length > 0) {
        const imageContainer = document.createElement(imageUrls.length > 1 ? 'div' : 'div');
        if (imageUrls.length > 1) imageContainer.className = 'message-image-grid';

        imageUrls.forEach(url => {
            const img = document.createElement('img');
            img.src = url;
            img.className = imageUrls.length > 1 ? 'message-image generated-img' : 'generated-img';
            img.alt = 'Generated image';
            img.dataset.chatImageDataUrl = url;
            imageContainer.appendChild(img);
        });

        messageContent.appendChild(imageContainer);
    }

    messageDiv.appendChild(messageContent);

    if (!isUser) {
        makeBotMessageDraggable(messageDiv, messageContent);
    }

    // Speaker button only for textual bot responses.
    if (!isUser && content) {
        const speakerBtn = document.createElement('button');
        speakerBtn.className = 'speaker-btn';
        speakerBtn.title = 'Read aloud';
        speakerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
            <path class="speaker-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path>
            <path class="speaker-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
        </svg>`;
        speakerBtn.addEventListener('click', () => speakText(content, speakerBtn));
        speakerBtn.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            enterVoiceMode();
        });
        messageDiv.appendChild(speakerBtn);
    }

    chatMessages.appendChild(messageDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    if (persist) {
        persistMessageToProject(role, content, {
            provider,
            mode,
            imageUrl: imageUrls.length > 1 ? imageUrls : imageUrls[0] || null
        });
    }
}

function addMessage(content, isUser = false, provider = null, mode = null, imageUrl = null) {
    renderMessageToChat(
        {
            role: isUser ? 'user' : 'bot',
            content,
            provider,
            mode,
            imageUrl
        },
        { persist: true }
    );
}

function makeBotMessageDraggable(messageDiv, messageContent) {
    if (!messageDiv || !messageContent || !messageDiv.classList.contains('bot-message')) return;
    messageContent.setAttribute('draggable', 'true');
    messageContent.classList.add('chat-draggable-source');
    messageContent.querySelectorAll('img').forEach((img) => {
        img.setAttribute('draggable', 'true');
        img.classList.add('chat-draggable-image');
    });
}

function getChatImageDataUrl(imgEl) {
    if (!imgEl) return '';
    if (imgEl.dataset && imgEl.dataset.chatImageDataUrl) return imgEl.dataset.chatImageDataUrl;

    const src = imgEl.currentSrc || imgEl.src || '';
    if (src.startsWith('data:image/')) return src;
    if (!imgEl.complete || !imgEl.naturalWidth || !imgEl.naturalHeight) return '';

    // Fallback for blob/object URLs and same-origin images.
    try {
        const canvas = document.createElement('canvas');
        canvas.width = imgEl.naturalWidth;
        canvas.height = imgEl.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) return '';
        ctx.drawImage(imgEl, 0, 0);
        return canvas.toDataURL('image/png');
    } catch {
        return '';
    }
}

function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const raw = typeof reader.result === 'string' ? reader.result : '';
            const compressed = await compressDataUrlForStorage(raw);
            resolve(compressed);
        };
        reader.onerror = () => reject(new Error('Failed to read image blob'));
        reader.readAsDataURL(blob);
    });
}

function persistCurrentWhiteboardToProject() {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project || !window.whiteboard) return;

    // Whiteboard elements are stored in memory only (in window.whiteboard)
    // Do NOT persist to localStorage — canvas data is too large
    project.modified = new Date().toISOString();
    // Minimal save: metadata only, not drawing data
    renderProjects();
}

let whiteboardAutosaveTimer = null;
let whiteboardAutosaveBound = false;

function initializeWhiteboardAutosave() {
    if (whiteboardAutosaveBound) return;

    const scheduleWhiteboardPersist = () => {
        if (whiteboardAutosaveTimer) {
            clearTimeout(whiteboardAutosaveTimer);
        }
        whiteboardAutosaveTimer = setTimeout(() => {
            whiteboardAutosaveTimer = null;
            persistCurrentWhiteboardToProject();
        }, 200);
    };

    document.addEventListener('whiteboard:changed', scheduleWhiteboardPersist);
    window.addEventListener('beforeunload', () => {
        persistCurrentWhiteboardToProject();
    });

    whiteboardAutosaveBound = true;
}

function initializeChatToWhiteboardDnD() {
    const whiteboardContainer = document.querySelector('.whiteboard-container');
    if (!whiteboardContainer) return;

    const dragHint = document.createElement('div');
    dragHint.className = 'selection-drag-hint';
    dragHint.textContent = 'Drag to board to save';
    document.body.appendChild(dragHint);

    let dragHintHideTimer = null;

    const hideDragHint = () => {
        dragHint.classList.remove('show');
        if (dragHintHideTimer) {
            clearTimeout(dragHintHideTimer);
            dragHintHideTimer = null;
        }
    };

    const showDragHintNearSelection = () => {
        const selection = window.getSelection ? window.getSelection() : null;
        if (!selection || selection.isCollapsed || selection.rangeCount === 0) {
            hideDragHint();
            return;
        }

        const anchorElement = selection.anchorNode?.nodeType === 3 ? selection.anchorNode.parentElement : selection.anchorNode;
        const focusElement = selection.focusNode?.nodeType === 3 ? selection.focusNode.parentElement : selection.focusNode;

        const anchorInBot = anchorElement?.closest?.('.bot-message .message-content');
        const focusInBot = focusElement?.closest?.('.bot-message .message-content');

        if (!anchorInBot || !focusInBot) {
            hideDragHint();
            return;
        }

        const selectedText = selection.toString().trim();
        if (!selectedText) {
            hideDragHint();
            return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        dragHint.style.left = `${Math.max(12, rect.left + rect.width / 2)}px`;
        dragHint.style.top = `${Math.max(12, rect.top - 10)}px`;
        dragHint.classList.add('show');

        if (dragHintHideTimer) {
            clearTimeout(dragHintHideTimer);
        }
        dragHintHideTimer = setTimeout(() => {
            dragHint.classList.remove('show');
        }, 2200);
    };

    document.addEventListener('selectionchange', () => {
        showDragHintNearSelection();
    });

    chatMessages.addEventListener('dragstart', (e) => {
        const sourceMessage = e.target.closest('.bot-message');
        if (!sourceMessage) {
            e.preventDefault();
            return;
        }

        const draggedImage = e.target.closest('img');
        if (draggedImage && sourceMessage.contains(draggedImage)) {
            const sourceUrl = draggedImage.currentSrc || draggedImage.src || '';
            const dataUrl = getChatImageDataUrl(draggedImage);
            if (!sourceUrl && !dataUrl) {
                e.preventDefault();
                return;
            }

            const imagePayload = JSON.stringify({
                dataUrl,
                sourceUrl,
                alt: draggedImage.alt || ''
            });
            e.dataTransfer.setData(CHAT_IMAGE_MIME_TYPE, imagePayload);
            if (sourceUrl) e.dataTransfer.setData('text/uri-list', sourceUrl);
            e.dataTransfer.setData('text/plain', draggedImage.alt || 'image');
            e.dataTransfer.effectAllowed = 'copy';
            hideDragHint();
            return;
        }

        const selectedText = window.getSelection ? window.getSelection().toString().trim() : '';
        if (!selectedText) {
            e.preventDefault();
            return;
        }

        const target = e.target.closest('.message-content');
        if (!target) {
            e.preventDefault();
            return;
        }

        e.dataTransfer.setData(CHAT_TEXT_MIME_TYPE, selectedText);
        e.dataTransfer.setData('text/plain', selectedText);
        e.dataTransfer.effectAllowed = 'copy';
        hideDragHint();
    });

    whiteboardContainer.addEventListener('dragenter', (e) => {
        const types = Array.from(e.dataTransfer?.types || []);
        const hasText = types.includes(CHAT_TEXT_MIME_TYPE) || types.includes('text/plain');
        const hasImage = types.includes(CHAT_IMAGE_MIME_TYPE) || types.includes('text/uri-list');
        if (hasText || hasImage) {
            e.preventDefault();
            whiteboardContainer.classList.add('drop-ready');
        }
    });

    whiteboardContainer.addEventListener('dragover', (e) => {
        const types = Array.from(e.dataTransfer?.types || []);
        const hasText = types.includes(CHAT_TEXT_MIME_TYPE) || types.includes('text/plain');
        const hasImage = types.includes(CHAT_IMAGE_MIME_TYPE) || types.includes('text/uri-list');
        if (hasText || hasImage) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            whiteboardContainer.classList.add('drop-ready');
        }
    });

    whiteboardContainer.addEventListener('dragleave', (e) => {
        if (!whiteboardContainer.contains(e.relatedTarget)) {
            whiteboardContainer.classList.remove('drop-ready');
        }
    });

    whiteboardContainer.addEventListener('drop', async (e) => {
        e.preventDefault();
        whiteboardContainer.classList.remove('drop-ready');
        hideDragHint();

        if (!window.whiteboard || !window.whiteboard.canvas) return;

        const canvasRect = window.whiteboard.canvas.getBoundingClientRect();
        const canvasX = (e.clientX - canvasRect.left - window.whiteboard.offsetX) / window.whiteboard.scale;
        const canvasY = (e.clientY - canvasRect.top - window.whiteboard.offsetY) / window.whiteboard.scale;

        const imagePayloadRaw = e.dataTransfer.getData(CHAT_IMAGE_MIME_TYPE);
        if (imagePayloadRaw && typeof window.whiteboard.addImageFromDrop === 'function') {
            try {
                const imagePayload = JSON.parse(imagePayloadRaw);
                const imageSource = imagePayload.dataUrl || imagePayload.sourceUrl || '';
                if (imageSource) {
                    const inserted = await window.whiteboard.addImageFromDrop(imageSource, canvasX, canvasY);
                    if (inserted) persistCurrentWhiteboardToProject();
                    return;
                }
            } catch (error) {
                console.warn('Image drop payload parse failed:', error);
            }
        }

        const droppedText =
            (e.dataTransfer.getData(CHAT_TEXT_MIME_TYPE) || e.dataTransfer.getData('text/plain') || '').trim();
        if (!droppedText || !window.whiteboard || typeof window.whiteboard.addTextFromDrop !== 'function') {
            return;
        }

        window.whiteboard.addTextFromDrop(droppedText, canvasX, canvasY);
        persistCurrentWhiteboardToProject();
    });

    document.addEventListener('mousedown', (e) => {
        if (!e.target.closest('.bot-message .message-content')) {
            hideDragHint();
        }
    });
}

// ==================== TTS SPEAKER ====================
let currentAudio = null;

function stripMarkdown(text) {
    return text
        .replace(/```[\s\S]*?```/g, '')
        .replace(/`[^`]+`/g, '')
        .replace(/#{1,6}\s+/g, '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*]+)\*/g, '$1')
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '')
        .replace(/^\s*\d+\.\s+/gm, '')
        .replace(/\n{2,}/g, ' ')
        .trim();
}

async function speakText(text, btn) {
    // If this button is already playing, stop it
    if (btn.classList.contains('playing')) {
        currentAudio.pause();
        currentAudio = null;
        btn.classList.remove('playing');
        return;
    }
    // Stop any other playing audio
    if (currentAudio) {
        currentAudio.pause();
        currentAudio = null;
        document.querySelectorAll('.speaker-btn.playing').forEach(b => b.classList.remove('playing'));
    }
    btn.classList.add('loading');
    try {
        const clean = stripMarkdown(text);
        const res = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: clean })
        });
        if (!res.ok) throw new Error(await res.text());
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        currentAudio = audio;
        btn.classList.remove('loading');
        btn.classList.add('playing');
        audio.play();
        audio.onended = () => {
            btn.classList.remove('playing');
            URL.revokeObjectURL(url);
            currentAudio = null;
        };
    } catch (err) {
        console.error('TTS error:', err);
        btn.classList.remove('loading');
    }
}

// ==================== FULL VOICE MODE ====================
const voiceModeOverlay  = document.getElementById('inlineVoiceMode');
const voiceModeClose    = document.getElementById('ivmClose');
const voiceModeStatus   = document.getElementById('ivmStatus');
const voiceTranscript   = document.getElementById('ivmTranscript');
const inputWrapper      = document.querySelector('.input-wrapper');

let voiceModeActive     = false;
let voiceSilenceTimer   = null;
let voiceInterim        = '';
let voiceFinal          = '';
let voiceConvId         = 0;   // increments each turn — stale async calls bail out
let vmTranscriptTimer   = null;
let vmLastShown         = '';  // debounce: skip if text hasn't changed

// ── helpers ────────────────────────────────────────────────────────────────

function vmSetState(state) {
    voiceModeOverlay.classList.remove('listening', 'thinking', 'speaking');
    voiceModeOverlay.classList.add(state);
    const labels = { listening: 'Listening...', thinking: 'Thinking...', speaking: 'Speaking...' };
    voiceModeStatus.textContent = labels[state] || '';
    const wc = document.getElementById('ivmWaveContainer');
    if (wc) wc.className = 'ivm-wave-container ' + state;
}

// Show text in transcript with a single smooth fade-in (debounced to avoid flash)
function vmShowText(text) {
    if (!text || text === vmLastShown) return;
    vmLastShown = text;
    clearTimeout(vmTranscriptTimer);
    vmTranscriptTimer = setTimeout(() => {
        voiceTranscript.classList.remove('ivm-word-in');
        void voiceTranscript.offsetWidth;            // restart animation
        voiceTranscript.textContent = text;
        voiceTranscript.classList.add('ivm-word-in');
    }, 80);                                          // 80ms debounce — smooth, not flashy
}

function vmClearTranscript() {
    clearTimeout(vmTranscriptTimer);
    vmLastShown = '';
    voiceTranscript.classList.remove('ivm-word-in');
    voiceTranscript.textContent = '';
}

// Typewrite AI reply in the transcript — word-group fade, cancellable via convId
function vmTypewrite(text, myConvId) {
    vmClearTranscript();
    const words = text.split(' ').filter(Boolean);
    let i = 0;
    const showNext = () => {
        if (!voiceModeActive || voiceConvId !== myConvId) return; // stale — bail
        if (i >= words.length) return;
        const chunk = words.slice(i, i + 5).join(' ');
        i += 5;
        vmShowText(chunk);
        setTimeout(showNext, Math.max(600, chunk.split(' ').length * 280));
    };
    setTimeout(showNext, 200);
}

// ── stop everything mid-turn ────────────────────────────────────────────────
function vmAbortCurrent() {
    voiceConvId++;                    // invalidates any in-flight vmSendAndSpeak
    clearTimeout(voiceSilenceTimer);
    clearTimeout(vmTranscriptTimer);
    if (currentAudio) {
        currentAudio.pause();
        if (currentAudio.onended) currentAudio.onended = null;
        currentAudio = null;
    }
    window.speechSynthesis && window.speechSynthesis.cancel();
    vmClearTranscript();
}

// ── main conversation turn ──────────────────────────────────────────────────
async function vmSendAndSpeak(text) {
    if (!text.trim() || !voiceModeActive) return;

    const myId = ++voiceConvId;       // this turn's identity
    vmSetState('thinking');
    vmClearTranscript();

    // 1. Add user message to chat
    try { addMessage(text, true); } catch(e) { console.warn(e); }

    // 2. Fetch AI response
    let reply = '';
    try {
        const project = projects.find(p => p.id === currentProjectId);
        const chatRes = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                message: text,
                mode: selectedMode,
                agents: selectedAgents,
                projectContext: project?.productInfo || {}
            })
        });
        const chatData = await chatRes.json();
        reply = chatData.response || 'Sorry, I could not get a response.';
        try { addMessage(reply, false, chatData.provider, chatData.mode); } catch(e) { console.warn(e); }
    } catch (err) {
        console.error('vmSendAndSpeak fetch failed:', err);
        reply = 'Sorry, I could not connect right now.';
        try { addMessage(reply, false); } catch(e) {}
    }

    // ── bail if user interrupted during thinking ────────────────────────────
    if (!voiceModeActive || voiceConvId !== myId) return;

    // 3. Switch to speaking, pause recognition so AI voice doesn't self-trigger
    vmSetState('speaking');
    voiceFinal = '';
    voiceInterim = '';
    try { recognition.stop(); } catch(e) {}   // stop mic while TTS plays

    const clean = stripMarkdown(reply);
    vmTypewrite(clean, myId);

    // 4. TTS — try Kokoro, fall back to browser voice
    const onSpeakDone = () => {
        if (!voiceModeActive || voiceConvId !== myId) return;
        currentAudio = null;
        vmClearTranscript();
        vmSetState('listening');
        voiceFinal = '';
        voiceInterim = '';
        try { recognition.start(); } catch(e) {}
    };

    let ttsHandled = false;
    try {
        const ttsRes = await fetch('/api/tts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: clean })
        });
        // bail again — user may have interrupted while TTS was generating
        if (!voiceModeActive || voiceConvId !== myId) return;

        if (ttsRes.ok) {
            const blob  = await ttsRes.blob();
            const url   = URL.createObjectURL(blob);
            const audio = new Audio(url);
            currentAudio = audio;
            ttsHandled = true;
            audio.onended = () => { URL.revokeObjectURL(url); onSpeakDone(); };
            audio.onerror = () => { URL.revokeObjectURL(url); onSpeakDone(); };
            await audio.play().catch(() => { ttsHandled = false; URL.revokeObjectURL(url); currentAudio = null; });
        }
    } catch(e) {
        console.warn('Kokoro TTS failed, using browser voice:', e.message);
    }

    if (!ttsHandled) {
        if (!voiceModeActive || voiceConvId !== myId) return;
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.rate = 1.05;
        const applyVoice = (voices) => {
            const v = voices.find(v => /zira|hazel|susan|samantha|victoria|karen|moira|tessa|fiona|veena|allison|ava|nicky|female|woman/i.test(v.name));
            if (v) utter.voice = v;
        };
        const loaded = window.speechSynthesis.getVoices();
        if (loaded.length) applyVoice(loaded);
        else window.speechSynthesis.onvoiceschanged = () => applyVoice(window.speechSynthesis.getVoices());
        const fakeAudio = { pause: () => window.speechSynthesis.cancel() };
        currentAudio = fakeAudio;
        utter.onend = utter.onerror = () => { if (currentAudio === fakeAudio) onSpeakDone(); };
        window.speechSynthesis.speak(utter);
    }
}

// ── enter / exit ────────────────────────────────────────────────────────────
function enterVoiceMode() {
    if (!recognition) { alert('Speech recognition is not supported in this browser.'); return; }
    if (visualModeActive) { alert('Turn off Visual Mode before using Voice Mode.'); return; }
    vmAbortCurrent();
    if (isRecording) { isRecording = false; try { recognition.stop(); } catch(e){} }

    voiceModeActive = true;
    if (inputWrapper) inputWrapper.style.display = 'none';
    voiceModeOverlay.classList.add('active');
    vmSetState('listening');

    recognition.continuous    = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
        if (!voiceModeActive) return;

        // If AI is thinking or speaking → user is interrupting → abort & listen
        const state = voiceModeOverlay.classList;
        if (state.contains('thinking') || state.contains('speaking')) {
            vmAbortCurrent();
            vmSetState('listening');
            voiceFinal = '';
            voiceInterim = '';
            // restart recognition (was stopped during speaking)
            try { recognition.start(); } catch(e) {}
            return;
        }

        // Accumulate transcript
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) voiceFinal += event.results[i][0].transcript + ' ';
            else interim += event.results[i][0].transcript;
        }
        voiceInterim = interim;

        // Show the current interim words (debounced fade)
        const display = (interim || voiceFinal.trim().split(' ').slice(-5).join(' ')).trim();
        vmShowText(display);

        // Silence timer — 1.5s after last speech finalises the message
        clearTimeout(voiceSilenceTimer);
        if ((voiceFinal + voiceInterim).trim()) {
            voiceSilenceTimer = setTimeout(() => {
                const toSend = (voiceFinal + voiceInterim).trim();
                voiceFinal = '';
                voiceInterim = '';
                vmClearTranscript();
                if (toSend && voiceModeActive) {
                    try { recognition.stop(); } catch(e) {}
                    vmSendAndSpeak(toSend);
                }
            }, 1500);
        }
    };

    recognition.onend = () => {
        // Auto-restart only during listening state
        if (voiceModeActive && voiceModeOverlay.classList.contains('listening')) {
            try { recognition.start(); } catch(e) {}
        }
    };

    recognition.onerror = (event) => {
        if (event.error === 'no-speech' || event.error === 'aborted') return;
        if (event.error === 'not-allowed') { exitVoiceMode(); alert('Microphone access denied.'); }
    };

    try { recognition.start(); } catch(e) {}
}

function exitVoiceMode() {
    voiceModeActive = false;
    vmAbortCurrent();
    try { recognition.stop(); } catch(e) {}
    voiceModeOverlay.classList.remove('active', 'listening', 'thinking', 'speaking');
    if (inputWrapper) inputWrapper.style.display = '';
    isRecording = false;
    micButton.classList.remove('recording');
    vmClearTranscript();
    const wc = document.getElementById('ivmWaveContainer');
    if (wc) wc.className = 'ivm-wave-container';

    // Restore normal mic bindings
    recognition.onresult = (event) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            const t = event.results[i][0].transcript;
            if (event.results[i].isFinal) finalTranscript += t + ' ';
            else interimTranscript += t;
        }
        messageInput.value = finalTranscript + interimTranscript;
    };
    recognition.onend = () => {
        if (isRecording) {
            try { recognition.start(); } catch(e) { isRecording = false; micButton.classList.remove('recording'); }
        } else {
            micButton.classList.remove('recording');
            finalTranscript = '';
        }
    };
}

voiceModeClose.addEventListener('click', exitVoiceMode);
// Close on Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && voiceModeActive) exitVoiceMode();
});

// ==================== MIC RIGHT-CLICK CONTEXT MENU ====================
const micContextMenu = document.getElementById('micContextMenu');

micButton.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    micContextMenu.classList.add('show');
});

document.getElementById('micContextVoiceMode').addEventListener('click', () => {
    micContextMenu.classList.remove('show');
    enterVoiceMode();
});

// Dismiss menu on any outside click
document.addEventListener('click', (e) => {
    if (!micContextMenu.contains(e.target) && e.target !== micButton) {
        micContextMenu.classList.remove('show');
    }
});

function showTypingIndicator() {
    if (isTyping) return;
    
    isTyping = true;
    const typingDiv = document.createElement('div');
    typingDiv.className = 'message bot-message';
    typingDiv.id = 'typing-indicator';
    
    const typingContent = document.createElement('div');
    typingContent.className = 'message-content typing-indicator show';
    typingContent.innerHTML = `
        <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
        </div>
    `;
    
    typingDiv.appendChild(typingContent);
    chatMessages.appendChild(typingDiv);
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

function hideTypingIndicator() {
    const typingIndicator = document.getElementById('typing-indicator');
    if (typingIndicator) {
        typingIndicator.remove();
    }
    isTyping = false;
}

// ==================== VISUAL MODE (Image Generation) ====================
let visualModeActive = false;

const IMAGE_COMMANDS = /^(create image|generate image|\/draw|\/imagine)\s*/i;
const IMAGE_REQUEST_PATTERN = /\b(?:make|create|generate|draw|imagine)\b.*\b(?:image|images|picture|pictures|pic|pics|variation|variations)\b/i;
const IMAGE_COUNT_PATTERN = /\b(?:make|create|generate|draw|imagine)\s+(\d{1,3})\s+(?:images?|pictures?|pics?|variations?)\b/i;
const MAX_IMAGE_REQUEST_COUNT = 10;

function setVisualMode(on) {
    visualModeActive = on;
    if (visualModeBtn) {
        visualModeBtn.classList.toggle('active', on);
        visualModeBtn.setAttribute('aria-pressed', on ? 'true' : 'false');
        visualModeBtn.title = on ? 'Image mode enabled. Click to disable.' : 'Enable image mode';
    }
    micButton.disabled     = on;         // disable mic in visual mode
    micButton.title        = on ? 'Disabled in Visual Mode' : 'Voice input  |  Right-click → Voice Mode';
    if (on && voiceModeActive) exitVoiceMode();
    // Update placeholder
    messageInput.placeholder = on
        ? '✨ Describe what to generate…'
        : 'Type your message here…';
}

if (visualModeBtn) {
    visualModeBtn.addEventListener('click', () => {
        setVisualMode(!visualModeActive);
        messageInput.focus();
    });
}

async function setScreenCapture(on) {
    if (on) {
        // In Electron bubble mode: no getDisplayMedia needed — we capture on demand via IPC
        if (window.electronAPI?.captureScreen) {
            screenCaptureActive = true;
            if (eyeBtn) { eyeBtn.classList.add('active'); eyeBtn.title = 'Vision ON (Screen)'; }
            return;
        }
        try {
            screenCaptureStream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
            screenCaptureActive = true;
            if (eyeBtn) { eyeBtn.classList.add('active'); eyeBtn.title = 'Vision ON (Screen)'; }
            screenCaptureStream.getVideoTracks()[0].addEventListener('ended', () => setScreenCapture(false));
        } catch (err) {
            screenCaptureActive = false;
            if (eyeBtn) eyeBtn.classList.remove('active');
        }
    } else {
        if (screenCaptureStream) screenCaptureStream.getTracks().forEach(t => t.stop());
        screenCaptureStream = null;
        screenCaptureActive = false;
        if (eyeBtn) { eyeBtn.classList.remove('active'); eyeBtn.title = 'Enable vision input'; }
    }
}

async function captureScreenshot() {
    // In Electron: use native IPC capture (hides the window, grabs what's behind, restores)
    if (window.electronAPI?.captureScreen) {
        return await window.electronAPI.captureScreen();
    }
    // Web fallback: use the getDisplayMedia stream
    if (!screenCaptureStream) return null;
    const track = screenCaptureStream.getVideoTracks()[0];
    const imageCapture = new ImageCapture(track);
    const bitmap = await imageCapture.grabFrame();
    const canvas = document.createElement('canvas');
    canvas.width = bitmap.width;
    canvas.height = bitmap.height;
    canvas.getContext('2d').drawImage(bitmap, 0, 0);
    return canvas.toDataURL('image/png');
}

async function generateImage(prompt) {
    await generateImageSet(prompt, 1, 1);
}

function parseImageGenerationRequest(message, forceImageMode = false) {
    const rawMessage = String(message || '').trim();
    if (!rawMessage) return null;

    const isCommandRequest = IMAGE_COMMANDS.test(rawMessage);
    const isNaturalRequest = IMAGE_REQUEST_PATTERN.test(rawMessage);
    const shouldGenerateImage = forceImageMode || isCommandRequest || isNaturalRequest;
    if (!shouldGenerateImage) return null;

    const countMatch = rawMessage.match(IMAGE_COUNT_PATTERN);
    const requestedCount = countMatch ? parseInt(countMatch[1], 10) : 1;
    const count = Math.max(1, Math.min(MAX_IMAGE_REQUEST_COUNT, Number.isFinite(requestedCount) ? requestedCount : 1));

    let cleanedPrompt = rawMessage;
    if (isCommandRequest) {
        cleanedPrompt = cleanedPrompt.replace(IMAGE_COMMANDS, '').trim();
    }
    if (countMatch && countMatch[0]) {
        cleanedPrompt = cleanedPrompt.replace(countMatch[0], '').trim();
    }
    cleanedPrompt = cleanedPrompt.replace(/^(of|for)\s+/i, '').trim();

    return {
        prompt: cleanedPrompt || (isCommandRequest ? rawMessage.replace(IMAGE_COMMANDS, '').trim() : rawMessage),
        requestedCount: Number.isFinite(requestedCount) ? requestedCount : 1,
        count
    };
}

async function fetchGeneratedImageDataUrl(prompt, options = {}) {
    const productInfo = getCurrentProductInfoForRequest();
    const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            prompt,
            productInfo,
            seedImage: options.seedImage || undefined
        })
    });

    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(err.error || `HTTP ${res.status}`);
    }

    const blob = await res.blob();
    return blobToDataUrl(blob);
}

async function generateImageSet(prompt, count = 1, requestedCount = count, options = {}) {
    addMessage(prompt, true, null, null, options.sourceImage || null);
    showTypingIndicator();
    sendButton.disabled = true;

    try {
        const effectiveCount = Math.max(1, Math.min(MAX_IMAGE_REQUEST_COUNT, Number(count) || 1));
        const imageUrls = [];
        const generationErrors = [];

        for (let i = 0; i < effectiveCount; i++) {
            try {
                const dataUrl = await fetchGeneratedImageDataUrl(prompt, options);
                imageUrls.push(dataUrl);
            } catch (error) {
                generationErrors.push(error);
            }
        }

        hideTypingIndicator();

        if (imageUrls.length === 0) {
            throw (generationErrors[0] || new Error('No images were generated'));
        }

        addMessage('', false, 'runware', 'visual', imageUrls.length > 1 ? imageUrls : imageUrls[0]);

        if (requestedCount > MAX_IMAGE_REQUEST_COUNT) {
            addMessage(`ℹ️ Requested ${requestedCount} images. Generated the maximum of ${MAX_IMAGE_REQUEST_COUNT}.`);
        }

        if (generationErrors.length > 0) {
            addMessage(`⚠️ Generated ${imageUrls.length}/${effectiveCount} images. Some generations failed.`);
        }
    } catch (err) {
        hideTypingIndicator();
        addMessage('⚠️ Could not generate image: ' + err.message);
        console.error('Image gen error:', err);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

async function sendMessage() {
    const message = messageInput.value.trim();
    const hasImage = selectedImages.length > 0;
    const willCaptureScreen = screenCaptureActive && !hasImage;
    const willCaptureCamera = visionMode === 'camera' && !!cameraStream && !!cameraPreviewVideo && !hasImage;
    
    if (!message && !hasImage && !willCaptureScreen && !willCaptureCamera) return;

    const composerImageDataUrl = hasImage ? selectedImages[0].dataUrl : null;

    // In Visual Mode, ALWAYS route to image generation (never to text chat).
    if (visualModeActive) {
        let seedImageForGeneration = composerImageDataUrl;
        if (!seedImageForGeneration && willCaptureScreen) {
            seedImageForGeneration = await captureScreenshot();
        } else if (!seedImageForGeneration && willCaptureCamera) {
            seedImageForGeneration = captureFromLiveCameraFeed();
        }

        const imageRequest = parseImageGenerationRequest(message, true);
        const promptText = imageRequest?.prompt || message || (seedImageForGeneration ? 'Create a refined variation of this image' : 'Generate an image concept');
        const count = imageRequest?.count || 1;
        const requestedCount = imageRequest?.requestedCount || count;

        messageInput.value = '';
        if (hasImage) clearImages();

        await generateImageSet(
            promptText,
            count,
            requestedCount,
            {
                seedImage: seedImageForGeneration || undefined,
                sourceImage: seedImageForGeneration || null
            }
        );
        return;
    }

    let capturedVisionDataUrl = null;

    if (!hasImage && willCaptureScreen) {
        capturedVisionDataUrl = await captureScreenshot();
    } else if (!hasImage && willCaptureCamera) {
        capturedVisionDataUrl = captureFromLiveCameraFeed();
    }

    // Clear input immediately to prevent voice recognition from repopulating it
    messageInput.value = '';
    if (hasImage) clearImages();

    // Stop recording if active
    if (isRecording && recognition) {
        isRecording = false;
        recognition.stop();
        micButton.classList.remove('recording');
        finalTranscript = '';
    }
    
    // Add user message with image
    if (composerImageDataUrl || capturedVisionDataUrl) {
        addMessage(message, true, null, null, composerImageDataUrl || capturedVisionDataUrl);
    } else {
        addMessage(message, true);
    }
    
    // Disable send button and show typing indicator
    sendButton.disabled = true;
    showTypingIndicator();
    
    try {
        const currentProject = projects.find(p => p.id === currentProjectId);
        const requestBody = { 
            message: message || 'What do you see in this image?', 
            mode: selectedMode,
            agents: selectedAgents,
            productInfo: getCurrentProductInfoForRequest(),
            conversationHistory: getConversationHistoryForRequest(message)
        };
        logProductInfoDebug('sendMessage.requestBody', {
            mode: requestBody.mode,
            agents: requestBody.agents,
            messageLength: (requestBody.message || '').length,
            conversationHistoryCount: requestBody.conversationHistory?.length || 0,
            productInfo: summarizeProductInfo(requestBody.productInfo)
        });
        
        // Add image if present
        if (composerImageDataUrl) {
            requestBody.image = composerImageDataUrl;
        } else if (capturedVisionDataUrl) {
            requestBody.image = capturedVisionDataUrl;
        }
        
        const response = await fetch('/api/chat/stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody),
        });

        if (!response.ok) {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error. Please try again.');
            console.error('API Error:', response.status);
        } else {
            hideTypingIndicator();

            // Create live streaming bubble
            const streamDiv = document.createElement('div');
            streamDiv.className = 'message bot-message fade-in-message';
            const streamContent = document.createElement('div');
            streamContent.className = 'message-content';
            streamDiv.appendChild(streamContent);
            chatMessages.appendChild(streamDiv);
            chatMessages.scrollTop = chatMessages.scrollHeight;

            let accumulated = '';
            let doneEvt = null;
            let streamErrorMessage = '';
            const reader = response.body.getReader();
            const decoder = new TextDecoder();
            let sseBuf = '';

            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    sseBuf += decoder.decode(value, { stream: true });
                    const lines = sseBuf.split('\n');
                    sseBuf = lines.pop();
                    for (const line of lines) {
                        if (!line.startsWith('data: ')) continue;
                        const raw = line.slice(6).trim();
                        if (!raw) continue;
                        try {
                            const evt = JSON.parse(raw);
                            if (evt.error) {
                                streamErrorMessage = evt.error;
                                break;
                            }
                            if (evt.token) {
                                accumulated += evt.token;
                                streamContent.innerHTML = marked.parse(accumulated);
                                chatMessages.scrollTop = chatMessages.scrollHeight;
                            }
                            if (evt.done) doneEvt = evt;
                        } catch (e) { console.warn('SSE parse:', e.message); }
                    }
                    if (streamErrorMessage) break;
                }
                // Flush any data remaining in the buffer after the stream closes
                const residual = sseBuf.trim();
                if (residual && residual.startsWith('data: ')) {
                    try {
                        const evt = JSON.parse(residual.slice(6).trim());
                        if (evt.done) doneEvt = evt;
                    } catch (e) { console.warn('SSE residual parse:', e.message); }
                }
            } catch (streamErr) {
                console.error('Stream read error:', streamErr);
            }

            // Add provider/mode badges
            const streamProvider = doneEvt?.provider || null;
            const streamMode = doneEvt?.mode || null;
            logProductInfoDebug('sendMessage.streamDoneEvent', {
                hasDoneEvent: !!doneEvt,
                provider: streamProvider,
                mode: streamMode,
                hasProductInfo: !!doneEvt?.productInfo,
                productInfo: summarizeProductInfo(doneEvt?.productInfo || null),
                streamErrorMessage
            });
            if (streamProvider || streamMode) {
                let badges = '';
                if (streamMode) badges += `<span style="background: #9c27b0; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px; margin-right: 5px;">${streamMode.toUpperCase()}</span>`;
                if (streamProvider) badges += `<span style="background: #667eea; color: white; padding: 2px 8px; border-radius: 12px; font-size: 11px;">${streamProvider.toUpperCase()}</span>`;
                streamContent.innerHTML = `<div style="margin-bottom: 5px;">${badges}</div>${marked.parse(accumulated)}`;
            }

            if (streamErrorMessage && !accumulated) {
                streamDiv.remove();
                addMessage(`Sorry, I hit a streaming error: ${streamErrorMessage}`);
                return;
            }

            // Speaker button and draggable
            if (accumulated) {
                makeBotMessageDraggable(streamDiv, streamContent);
                const speakerBtn = document.createElement('button');
                speakerBtn.className = 'speaker-btn';
                speakerBtn.title = 'Read aloud';
                speakerBtn.innerHTML = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path class="speaker-wave-2" d="M19.07 4.93a10 10 0 0 1 0 14.14"></path><path class="speaker-wave-1" d="M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>`;
                speakerBtn.addEventListener('click', () => speakText(accumulated, speakerBtn));
                speakerBtn.addEventListener('contextmenu', (e) => { e.preventDefault(); enterVoiceMode(); });
                streamDiv.appendChild(speakerBtn);
            }

            // Persist and update product info
            saveMessageToProject('bot', accumulated, { provider: streamProvider, mode: streamMode });
            if (doneEvt?.productInfo) {
                const liveProject = projects.find(p => p.id === currentProjectId);
                if (!liveProject) {
                    logProductInfoDebug('sendMessage.applySkippedNoLiveProject', { currentProjectId });
                } else {
                    liveProject.productInfo = doneEvt.productInfo;
                    liveProject.modified = new Date().toISOString();
                    saveProjects();
                    loadProductInfoToForm(true);
                    logProductInfoDebug('sendMessage.appliedProjectInfo', {
                        projectId: liveProject.id,
                        projectTitle: liveProject.title,
                        productInfo: summarizeProductInfo(liveProject.productInfo)
                    });
                    console.log('\u2705 Product info extracted and updated from chat:', liveProject.productInfo);
                }
            }
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I couldn\'t connect to the server. Please try again.');
        console.error('Network Error:', error);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
        clearImages();
    }
}

// Function to send image from whiteboard to chat for analysis
window.sendImageToChat = async function(imageDataUrls) {
    // Handle single or multiple images
    const images = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrls];
    const message = images.length === 1 ? 'Analyze this image' : `Analyze these ${images.length} images`;
    
    // Add message to chat
    addMessage(message, true, null, null, images.length === 1 ? images[0] : images);
    
    // Disable send button and show typing indicator
    sendButton.disabled = true;
    showTypingIndicator();
    
    try {
        const currentProject = projects.find(p => p.id === currentProjectId);
        const requestBody = { 
            message: images.length === 1 ? 'Provide detailed critical analysis' : `Provide detailed critical analysis of these ${images.length} images`,
            mode: selectedMode,
            image: images.length === 1 ? images[0] : images,
            analyze: true,
            agents: selectedAgents,
            productInfo: currentProject?.productInfo || null,
            conversationHistory: getConversationHistoryForRequest()
        };
        logProductInfoDebug('sendImageToChat.requestBody', {
            mode: requestBody.mode,
            analyze: requestBody.analyze,
            imageCount: images.length,
            productInfo: summarizeProductInfo(requestBody.productInfo)
        });
        
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
        });
        
        const data = await response.json();
        logProductInfoDebug('sendImageToChat.response', {
            ok: response.ok,
            hasProductInfo: !!data?.productInfo,
            productInfo: summarizeProductInfo(data?.productInfo || null)
        });
        
        if (response.ok) {
            hideTypingIndicator();
            addMessage(data.response, false, data.provider, data.mode);
            
            // Update product info if returned from backend
            if (data.productInfo) {
                const liveProject = projects.find(p => p.id === currentProjectId);
                if (!liveProject) {
                    logProductInfoDebug('sendImageToChat.applySkippedNoLiveProject', { currentProjectId });
                } else {
                    liveProject.productInfo = data.productInfo;
                    liveProject.modified = new Date().toISOString();
                    saveProjects();
                    loadProductInfoToForm(true);
                    logProductInfoDebug('sendImageToChat.appliedProjectInfo', {
                        projectId: liveProject.id,
                        projectTitle: liveProject.title,
                        productInfo: summarizeProductInfo(liveProject.productInfo)
                    });
                    console.log('\u2705 Product info updated for project:', liveProject.title);
                }
            }
        } else {
            hideTypingIndicator();
            addMessage('Sorry, I encountered an error analyzing the image. Please try again.');
            console.error('API Error:', data.error);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I couldn\'t connect to the server. Please try again.');
        console.error('Network Error:', error);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
}

window.appendImagesToChatComposer = function(imageDataUrls) {
    const images = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrls];
    selectedImages = images.map((dataUrl) => ({ dataUrl, file: null }));
    updateImagePreview();
    messageInput.focus();
};

window.remixWhiteboardImage = async function(imageDataUrl, remixStyle = 'sketchify') {
    if (!imageDataUrl) return;

    const stylePromptMap = {
        sketchify: {
            instruction: 'sketch-like concept rendering'
        },
        wireframe: {
            instruction: 'wireframe-style product visualization'
        },
        'abstract silhouette': {
            instruction: 'abstract silhouette interpretation'
        }
    };

    const styleConfig = stylePromptMap[remixStyle] || { instruction: remixStyle };
    const styleInstruction = styleConfig.instruction;
    const userLabel = `Remix (${remixStyle})`;
    addMessage(userLabel, true, null, null, imageDataUrl);
    showTypingIndicator();
    sendButton.disabled = true;

    try {
        const productInfo = getCurrentProductInfoForRequest();

        // Ask model to produce a concise generation prompt from the image context.
        const promptResponse = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Create a single image-generation prompt that remixes this design into a ${styleInstruction}. Return only the prompt text.`,
                mode: 'conceptualization',
                image: imageDataUrl,
                agents: selectedAgents,
                productInfo,
                openrouterModel: 'google/gemma-3-4b-it',
                strictModel: true
            }),
        });

        const promptData = await promptResponse.json();
        const generatedPrompt = (promptData.response || '').replace(/^```[\s\S]*?\n?|```$/g, '').trim();

        if (!promptResponse.ok || !generatedPrompt) {
            throw new Error(promptData.error || 'Failed to build remix prompt');
        }

        const imageResponse = await fetch('/api/generate-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                prompt: generatedPrompt,
                productInfo,
                seedImage: imageDataUrl
            })
        });

        hideTypingIndicator();
        if (!imageResponse.ok) {
            const err = await imageResponse.json().catch(() => ({ error: 'Unknown error' }));
            throw new Error(err.error || `HTTP ${imageResponse.status}`);
        }

        const blob = await imageResponse.blob();
        const remixedImageDataUrl = await blobToDataUrl(blob);
        addMessage('', false, 'runware', 'remix', remixedImageDataUrl);
    } catch (error) {
        hideTypingIndicator();
        addMessage(`⚠️ Remix failed: ${error.message}`);
        console.error('Remix Error:', error);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
};

window.requestTechnicalFeasibilityFromWhiteboard = async function(imageDataUrls) {
    const images = Array.isArray(imageDataUrls) ? imageDataUrls : [imageDataUrls];
    const label = images.length === 1 ? 'Technical feasibility report' : `Technical feasibility report (${images.length} images)`;

    addMessage(label, true, null, null, images.length === 1 ? images[0] : images);
    showTypingIndicator();
    sendButton.disabled = true;

    try {
        const currentProject = projects.find(p => p.id === currentProjectId);
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: 'Provide a detailed technical feasibility report for manufacturing this concept in the real world. Cover materials, processes, tolerances, tooling, assembly, certification/safety, costs, risks, and recommended next prototype steps.',
                mode: 'execution',
                image: images.length === 1 ? images[0] : images,
                analyze: true,
                agents: Array.from(new Set([...(selectedAgents || []), 'cmft'])),
                productInfo: currentProject?.productInfo || null
            }),
        });

        const data = await response.json();
        hideTypingIndicator();

        if (response.ok) {
            addMessage(data.response, false, data.provider, data.mode);
        } else {
            addMessage('Sorry, I could not generate the feasibility report right now.');
            console.error('Feasibility Error:', data.error);
        }
    } catch (error) {
        hideTypingIndicator();
        addMessage('Sorry, I couldn\'t connect to generate the feasibility report.');
        console.error('Feasibility Network Error:', error);
    } finally {
        sendButton.disabled = false;
        messageInput.focus();
    }
};

// Image handling functions
function showImagePreview() {
    if (selectedImages.length > 0) {
        imagePreview.classList.add('show');
    } else {
        imagePreview.classList.remove('show');
    }
}

function clearImages() {
    selectedImages = [];
    imagePreview.innerHTML = '';
    imagePreview.classList.remove('show');
    imageInput.value = '';
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async () => {
            const raw = typeof reader.result === 'string' ? reader.result : '';
            const compressed = await compressDataUrlForStorage(raw);
            resolve(compressed);
        };
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

function attachImageToComposer(dataUrl, file = null, replace = true) {
    if (!dataUrl) return;
    if (replace) {
        selectedImages = [{ dataUrl, file }];
    } else {
        selectedImages.push({ dataUrl, file });
    }
    updateImagePreview();
}

async function attachImageFilesToComposer(files, replace = true) {
    const imageFiles = (files || []).filter(file => file && file.type && file.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const dataUrl = await readFileAsDataUrl(imageFiles[0]);
    attachImageToComposer(dataUrl, imageFiles[0], replace);
    messageInput.focus();
}

function isImageFileDragEvent(event) {
    const dt = event.dataTransfer;
    if (!dt) return false;

    // Ignore internal chat image drags so whiteboard drops do not attach to composer.
    const types = Array.from(dt.types || []);
    if (types.includes(CHAT_IMAGE_MIME_TYPE)) return false;
    if (!types.includes('Files')) return false;

    const items = Array.from(dt.items || []);
    if (items.length === 0) return true;
    return items.some(item => item.kind === 'file' && item.type.startsWith('image/'));
}

function initializeChatImageDnDAndPaste() {
    if (!chatWindowEl || !chatDropOverlay) return;

    let dragDepth = 0;
    const showChatDropOverlay = () => {
        chatWindowEl.classList.add('chat-drop-active');
    };
    const hideChatDropOverlay = () => {
        chatWindowEl.classList.remove('chat-drop-active');
    };

    document.addEventListener('dragenter', (event) => {
        if (!isImageFileDragEvent(event)) return;
        event.preventDefault();
        dragDepth += 1;
        showChatDropOverlay();
    });

    document.addEventListener('dragover', (event) => {
        if (!isImageFileDragEvent(event)) return;
        event.preventDefault();
        if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
        showChatDropOverlay();
    });

    document.addEventListener('dragleave', (event) => {
        if (!isImageFileDragEvent(event)) return;
        event.preventDefault();
        dragDepth = Math.max(0, dragDepth - 1);
        if (dragDepth === 0) hideChatDropOverlay();
    });

    document.addEventListener('drop', async (event) => {
        if (!isImageFileDragEvent(event)) return;

        const droppedInsideWhiteboard = !!event.target?.closest?.('.whiteboard-container');
        if (droppedInsideWhiteboard) return;

        event.preventDefault();
        dragDepth = 0;
        hideChatDropOverlay();

        const files = Array.from(event.dataTransfer?.files || []);
        await attachImageFilesToComposer(files, true);
    });

    document.addEventListener('paste', async (event) => {
        const target = event.target;
        const isInsideChat = !!target?.closest?.('.chat-window');
        if (!isInsideChat) return;

        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.kind === 'file' && item.type.startsWith('image/'));
        if (!imageItem) return;

        event.preventDefault();
        const file = imageItem.getAsFile();
        if (!file) return;
        await attachImageFilesToComposer([file], true);
    });
}

function removeImage(index) {
    selectedImages.splice(index, 1);
    updateImagePreview();
}

function updateImagePreview() {
    imagePreview.innerHTML = '';
    selectedImages.forEach((img, index) => {
        const previewItem = document.createElement('div');
        previewItem.className = 'preview-item';
        
        const imgElement = document.createElement('img');
        imgElement.src = img.dataUrl;
        
        const removeBtn = document.createElement('button');
        removeBtn.className = 'remove-image';
        removeBtn.innerHTML = '×';
        removeBtn.onclick = () => removeImage(index);
        
        previewItem.appendChild(imgElement);
        previewItem.appendChild(removeBtn);
        imagePreview.appendChild(previewItem);
    });
    
    showImagePreview();
}

// Event listeners
sendButton.addEventListener('click', sendMessage);

messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Mode selector popup
modeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    agentPopup.classList.remove('show');
    modePopup.classList.toggle('show');
});

// Mode option selection
document.querySelectorAll('.mode-option').forEach(option => {
    option.addEventListener('click', () => {
        selectedMode = option.dataset.mode;
        updateModeOptions();
        modePopup.classList.remove('show');
    });
});

// Close popup when clicking outside
document.addEventListener('click', (e) => {
    if (!modePopup.contains(e.target) && e.target !== modeButton) {
        modePopup.classList.remove('show');
    }
    if (!agentPopup.contains(e.target) && e.target !== agentButton) {
        agentPopup.classList.remove('show');
    }
});

// Agent selector popup
agentButton.addEventListener('click', (e) => {
    e.stopPropagation();
    modePopup.classList.remove('show');
    agentPopup.classList.toggle('show');
});

// Agent option click handling
document.querySelectorAll('.agent-option').forEach(option => {
    option.addEventListener('click', (e) => {
        e.stopPropagation();
        const checkbox = option.querySelector('.agent-checkbox');
        checkbox.checked = !checkbox.checked;
        
        const agentType = checkbox.id.replace('agent-', '');
        if (checkbox.checked) {
            if (!selectedAgents.includes(agentType)) {
                selectedAgents.push(agentType);
            }
        } else {
            selectedAgents = selectedAgents.filter(a => a !== agentType);
        }
        updateAgentCount();
    });
});

function updateAgentCount() {
    agentCount.textContent = selectedAgents.length;
    agentButton.style.borderColor = selectedAgents.length > 0 ? '#667eea' : '#e0e0e0';
}

// Project Management Functions
function loadProjects() {
    const savedProjects = localStorage.getItem(CHAT_STORAGE_KEY);
    if (savedProjects) {
        try {
            projects = JSON.parse(savedProjects);
        } catch {
            projects = [];
            localStorage.removeItem(CHAT_STORAGE_KEY);
        }
        
        // Migrate existing projects to include productInfo and multi-chat support.
        let needsSave = false;
        projects = projects.map(project => {
            if (!project.productInfo) {
                needsSave = true;
                project.productInfo = {
                    productName: '',
                    direction: '',
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

            if (!Array.isArray(project.chats) || project.chats.length === 0) {
                needsSave = true;
                const migratedMessages = Array.isArray(project.messages) ? project.messages : [];
                const now = project.modified || project.created || new Date().toISOString();
                project.chats = [{
                    id: Date.now() + Math.floor(Math.random() * 1000),
                    title: 'Chat 1',
                    messages: migratedMessages,
                    created: now,
                    modified: now
                }];
            }

            if (!project.currentChatId || !project.chats.some(chat => chat.id === project.currentChatId)) {
                needsSave = true;
                project.currentChatId = project.chats[0].id;
            }

            // Clean up legacy whiteboard data (storage-heavy, memory-only now)
            if (project.whiteboardElements && Array.isArray(project.whiteboardElements) && project.whiteboardElements.length > 0) {
                needsSave = true;
                project.whiteboardElements = [];
                console.log('🧹 Cleaned up legacy whiteboard data from project:', project.title);
            }

            project.messages = project.chats.find(chat => chat.id === project.currentChatId)?.messages || [];
            return project;
        });
        
        if (needsSave) {
            saveProjects();
            console.log('✅ Migrated projects to include productInfo and chat threads');
        }
    } else {
        // Create default project
        const now = new Date().toISOString();
        const defaultChatId = Date.now() + 1;
        projects = [{
            id: Date.now(),
            title: 'New Project',
            chats: [{
                id: defaultChatId,
                title: 'Chat 1',
                messages: [],
                created: now,
                modified: now
            }],
            currentChatId: defaultChatId,
            messages: [],
            whiteboardElements: [],
            productInfo: {
                productName: '',
                direction: '',
                size: { dimensions: '', scale: '', notes: '' },
                color: { palette: [], primary: '', secondary: '', notes: '' },
                form: { shape: '', style: '', aesthetics: '', notes: '' },
                context: { useCase: '', environment: '', targetAudience: '', notes: '' },
                purpose: { primaryFunction: '', problemSolved: '', goals: [], notes: '' },
                cmft: { certifications: [], materials: [], finish: '', testing: [], notes: '' },
                features: { core: [], secondary: [], innovative: [], notes: '' },
                generalNotes: ''
            },
            created: now,
            modified: now
        }];
        saveProjects();
    }
    
    // Set first project as current if none selected
    if (!currentProjectId && projects.length > 0) {
        currentProjectId = projects[0].id;
    }

    const currentProject = getCurrentProject();
    ensureProjectChats(currentProject);
    currentChatId = currentProject?.currentChatId || null;
    
    renderProjects();
    renderChatThreadMenu();

    if (currentProjectId) {
        loadProject(currentProjectId);
    }
}

function saveProjects() {
    const normalizedProjects = projects.map(project => {
        const nextProject = { ...project };
        if (Array.isArray(nextProject.chats)) {
            nextProject.chats = nextProject.chats.map(chat => {
                const nextChat = { ...chat };
                if (Array.isArray(nextChat.messages) && nextChat.messages.length > MAX_STORED_MESSAGES_PER_CHAT) {
                    nextChat.messages = nextChat.messages.slice(-MAX_STORED_MESSAGES_PER_CHAT);
                }
                return nextChat;
            });
        }
        return nextProject;
    });

    try {
        localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(normalizedProjects));
        projects = normalizedProjects;
    } catch (error) {
        const isQuotaError = error && (error.name === 'QuotaExceededError' || String(error.message || '').toLowerCase().includes('quota'));
        if (isQuotaError) {
            const strippedProjects = normalizedProjects.map(project => ({
                ...project,
                chats: (project.chats || []).map(chat => ({
                    ...chat,
                    messages: (chat.messages || []).map(msg => {
                        if (!msg.imageUrl) return msg;
                        const { imageUrl, ...rest } = msg;
                        return rest;
                    })
                }))
            }));

            localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(strippedProjects));
            projects = strippedProjects;
            console.warn('⚠️ Storage quota reached. Saved text chat data and removed persisted images to recover space.');
        } else {
            throw error;
        }
    }

    renderChatThreadMenu();
}

function applyOneTimeStorageReset() {
    try {
        const resetApplied = localStorage.getItem(STORAGE_RESET_VERSION_KEY);
        if (resetApplied === STORAGE_RESET_VERSION) return;
        localStorage.removeItem(CHAT_STORAGE_KEY);
        localStorage.setItem(STORAGE_RESET_VERSION_KEY, STORAGE_RESET_VERSION);
        console.log('🧹 Cleared saved chat storage once to recover from quota issues.');
    } catch (error) {
        console.warn('⚠️ Failed to apply one-time storage reset:', error.message);
    }
}

function renderProjects() {
    projectsScroll.innerHTML = '';
    
    // Render existing projects
    projects.forEach(project => {
        ensureProjectChats(project);
        const card = document.createElement('div');
        card.className = 'project-card';
        if (project.id === currentProjectId) {
            card.classList.add('active');
        }
        
        const lastModified = new Date(project.modified);
            // Clear persisted whiteboard elements on load (they are memory-only)
            project.whiteboardElements = [];
        card.addEventListener('click', () => loadProject(project.id));
        card.addEventListener('contextmenu', (e) => showContextMenu(e, project.id));
        projectsScroll.appendChild(card);
    });
    
    // Add "New Project" card
    const newCard = document.createElement('div');
    newCard.className = 'project-card new-project';
    newCard.innerHTML = `
        <div class="new-project-icon">+</div>
        <div class="new-project-text">New Project</div>
    `;
    newCard.addEventListener('click', createNewProject);
    projectsScroll.appendChild(newCard);
}

function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
        const hours = Math.floor(diff / (1000 * 60 * 60));
        if (hours === 0) {
            const minutes = Math.floor(diff / (1000 * 60));
            return minutes <= 1 ? 'Just now' : `${minutes}m ago`;
        }
        return hours === 1 ? '1h ago' : `${hours}h ago`;
    } else if (days === 1) {
        return 'Yesterday';
    } else if (days < 7) {
        return `${days}d ago`;
    } else {
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}

function createNewProject() {
    const projectName = prompt('Enter project name:', `Project ${projects.length + 1}`);
    if (!projectName) return;

    const now = new Date().toISOString();
    const firstChatId = Date.now() + 1;
    
    const newProject = {
        id: Date.now(),
        title: projectName,
        chats: [{
            id: firstChatId,
            title: 'Chat 1',
            messages: [],
            created: now,
            modified: now
        }],
        currentChatId: firstChatId,
        messages: [],
        whiteboardElements: [],
        productInfo: {
            productName: '',
            direction: '',
            size: { dimensions: '', scale: '', notes: '' },
            color: { palette: [], primary: '', secondary: '', notes: '' },
            form: { shape: '', style: '', aesthetics: '', notes: '' },
            context: { useCase: '', environment: '', targetAudience: '', notes: '' },
            purpose: { primaryFunction: '', problemSolved: '', goals: [], notes: '' },
            cmft: { certifications: [], materials: [], finish: '', testing: [], notes: '' },
            features: { core: [], secondary: [], innovative: [], notes: '' },
            generalNotes: ''
        },
        created: now,
        modified: now
    };
    
    projects.unshift(newProject);
    saveProjects();
    loadProject(newProject.id);
}

function loadProject(projectId) {
    isProjectsMenuPinned = false;
    closeProjectsMenu({ force: true });

    // Save current project's whiteboard state before switching
    // NOTE: Whiteboard elements are NOT persisted due to storage size.
    // They remain in memory while the app is open.
    if (currentProjectId && currentProjectId !== projectId && window.whiteboard) {
        const currentProject = projects.find(p => p.id === currentProjectId);
        if (currentProject) {
            // Do not persist: currentProject.whiteboardElements = window.whiteboard.getElements();
            // saveProjects(); // Skip save to avoid storage bloat
        }
    }
    
    currentProjectId = projectId;
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;

    ensureProjectChats(project);
    currentChatId = project.currentChatId;
    renderCurrentChatMessages();
    
    // Load whiteboard elements
    if (window.whiteboard) {
        window.whiteboard.loadElements(project.whiteboardElements || []);
    }

    // Keep Project Info view in sync with selected project.
    loadProductInfoToForm();

    const activeView = document.querySelector('.view-tab[data-view].active')?.dataset.view || 'chat';
    setChatView(activeView);

    renderProjects();
    closeChatThreadMenu();
    renderChatThreadMenu();
}

function saveMessageToProject(role, content, messageMeta = {}) {
    const project = projects.find(p => p.id === currentProjectId);
    if (!project) return;

    ensureProjectChats(project);
    const chat = getCurrentChat(project);
    if (!chat) return;

    const now = new Date().toISOString();
    const messageRecord = {
        role,
        content: content || '',
        timestamp: now
    };

    if (messageMeta.provider) messageRecord.provider = messageMeta.provider;
    if (messageMeta.mode) messageRecord.mode = messageMeta.mode;

    chat.messages.push(messageRecord);
    chat.modified = now;
    project.currentChatId = chat.id;
    currentChatId = chat.id;
    project.messages = chat.messages;
    project.modified = now;

    // Update chat title from first user message.
    if (role === 'user' && chat.messages.filter(m => m.role === 'user').length === 1 && content) {
        chat.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }

    // Update project title only if still default.
    if (project.title === 'New Project' && role === 'user' && chat.messages.length === 1 && content) {
        project.title = content.substring(0, 30) + (content.length > 30 ? '...' : '');
    }
    
    // Note: Whiteboard elements are stored in memory only, not persisted to localStorage
    saveProjects();
    renderProjects();
    renderChatThreadMenu();
}

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
        readFileAsDataUrl(file)
            .then((dataUrl) => attachImageToComposer(dataUrl, file, true))
            .catch((error) => console.error('Image read error:', error));
    }
});

// Microphone button - voice input
micButton.addEventListener('click', () => {
    if (!recognition) {
        alert('Speech recognition is not supported in your browser. Please use Chrome, Edge, or Safari.');
        return;
    }
    
    if (isRecording) {
        isRecording = false;
        recognition.stop();
        micButton.classList.remove('recording');
    } else {
        recognition.start();
    }
});

// ==================== VISION MODE MENU ====================

let visionMode = null; // 'screen' or 'camera'
let cameraStream = null;
let selectedCameraDeviceId = '';
let cameraPreviewWindow = null;
let cameraPreviewVideo = null;
let cameraPreviewManuallyPositioned = false;
const visionModeMenu = document.getElementById('visionModeMenu');
const cameraDivider = document.getElementById('cameraDivider');
const cameraDeviceSelect = document.getElementById('cameraDeviceSelect');

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function positionCameraPreviewWindow(force = false) {
    if (!cameraPreviewWindow) return;
    if (cameraPreviewManuallyPositioned && !force) return;

    const previewWidth = cameraPreviewWindow.offsetWidth || 300;
    const previewHeight = cameraPreviewWindow.offsetHeight || 240;
    const margin = 16;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const chatRect = chatWindowEl?.getBoundingClientRect();

    let left = viewportWidth - previewWidth - margin;
    let top = margin;

    if (chatRect) {
        const spaceRight = viewportWidth - chatRect.right - margin;
        const spaceLeft = chatRect.left - margin;
        const alignedTop = clamp(chatRect.top, margin, Math.max(margin, viewportHeight - previewHeight - margin));

        if (spaceRight >= previewWidth) {
            left = chatRect.right + margin;
            top = alignedTop;
        } else if (spaceLeft >= previewWidth) {
            left = chatRect.left - previewWidth - margin;
            top = alignedTop;
        } else {
            const spaceAbove = chatRect.top - margin;
            const spaceBelow = viewportHeight - chatRect.bottom - margin;

            left = clamp(chatRect.left + (chatRect.width - previewWidth) / 2, margin, Math.max(margin, viewportWidth - previewWidth - margin));
            if (spaceBelow >= previewHeight) {
                top = chatRect.bottom + margin;
            } else if (spaceAbove >= previewHeight) {
                top = chatRect.top - previewHeight - margin;
            } else {
                top = clamp(chatRect.top + (chatRect.height - previewHeight) / 2, margin, Math.max(margin, viewportHeight - previewHeight - margin));
            }
        }
    }

    cameraPreviewWindow.style.left = `${clamp(left, margin, Math.max(margin, viewportWidth - previewWidth - margin))}px`;
    cameraPreviewWindow.style.top = `${clamp(top, margin, Math.max(margin, viewportHeight - previewHeight - margin))}px`;
}

function initializeCameraPreviewDragging() {
    if (!cameraPreviewWindow) return;

    const header = cameraPreviewWindow.querySelector('.camera-preview-header');
    if (!header || header.dataset.dragReady === 'true') return;

    header.dataset.dragReady = 'true';

    let isDragging = false;
    let offsetX = 0;
    let offsetY = 0;

    header.addEventListener('mousedown', (event) => {
        if (event.target.closest('.camera-preview-close')) return;

        const rect = cameraPreviewWindow.getBoundingClientRect();
        isDragging = true;
        cameraPreviewManuallyPositioned = true;
        offsetX = event.clientX - rect.left;
        offsetY = event.clientY - rect.top;
        cameraPreviewWindow.classList.add('dragging');
        event.preventDefault();
    });

    document.addEventListener('mousemove', (event) => {
        if (!isDragging || !cameraPreviewWindow) return;

        const previewWidth = cameraPreviewWindow.offsetWidth || 300;
        const previewHeight = cameraPreviewWindow.offsetHeight || 240;
        const margin = 8;
        const left = clamp(event.clientX - offsetX, margin, Math.max(margin, window.innerWidth - previewWidth - margin));
        const top = clamp(event.clientY - offsetY, margin, Math.max(margin, window.innerHeight - previewHeight - margin));

        cameraPreviewWindow.style.left = `${left}px`;
        cameraPreviewWindow.style.top = `${top}px`;
    });

    document.addEventListener('mouseup', () => {
        if (!isDragging || !cameraPreviewWindow) return;
        isDragging = false;
        cameraPreviewWindow.classList.remove('dragging');
    });
}

function ensureCameraPreviewWindow() {
    if (cameraPreviewWindow) return;

    cameraPreviewWindow = document.createElement('div');
    cameraPreviewWindow.id = 'cameraPreviewWindow';
    cameraPreviewWindow.className = 'camera-preview-window';
    cameraPreviewWindow.innerHTML = `
        <div class="camera-preview-header">
            <span>Live Camera</span>
            <button id="cameraPreviewClose" class="camera-preview-close" type="button" title="Close camera preview">x</button>
        </div>
        <video id="cameraPreviewVideo" autoplay playsinline muted></video>
        <div class="camera-preview-hint">Current frame is sent with your next message</div>
    `;
    document.body.appendChild(cameraPreviewWindow);

    cameraPreviewVideo = document.getElementById('cameraPreviewVideo');
    const closeBtn = document.getElementById('cameraPreviewClose');
    initializeCameraPreviewDragging();
    positionCameraPreviewWindow(true);

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            setVisionMode(null);
        });
    }
}

// Enumerate camera devices and populate dropdown
async function enumerateCameraDevices() {
    if (!cameraDeviceSelect || !cameraDivider) return;

    try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        
        // Clear existing options except the first one
        cameraDeviceSelect.innerHTML = '<option value="">Default Camera</option>';
        
        videoDevices.forEach((device, index) => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.textContent = device.label || `Camera ${index + 1}`;
            cameraDeviceSelect.appendChild(option);
        });
        
        // Show camera selector if there are camera devices
        if (videoDevices.length > 0) {
            cameraDivider.style.display = 'block';
            cameraDeviceSelect.style.display = 'block';
        } else {
            cameraDivider.style.display = 'none';
            cameraDeviceSelect.style.display = 'none';
        }
    } catch (error) {
        console.error('Error enumerating camera devices:', error);
    }
}

// Close vision mode menu
function closeVisionMenu() {
    if (visionModeMenu) visionModeMenu.classList.remove('show');
}

// Stop camera stream
function stopCameraStream() {
    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
        cameraStream = null;
    }
    if (cameraPreviewVideo) {
        cameraPreviewVideo.srcObject = null;
    }
}

async function startCameraFeed() {
    ensureCameraPreviewWindow();

    try {
        const constraints = {
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 },
                ...(selectedCameraDeviceId && { deviceId: { exact: selectedCameraDeviceId } })
            }
        };
        
        if (cameraStream) {
            stopCameraStream();
        }
        
        cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
        if (cameraPreviewVideo) {
            cameraPreviewVideo.srcObject = cameraStream;
            await cameraPreviewVideo.play();
        }
        if (cameraPreviewWindow) {
            cameraPreviewManuallyPositioned = false;
            positionCameraPreviewWindow(true);
            cameraPreviewWindow.classList.add('show');
        }
        if (eyeBtn) {
            eyeBtn.classList.add('active');
            eyeBtn.title = 'Vision ON (Camera)';
        }
        return true;
    } catch (error) {
        console.error('Error starting camera feed:', error);
        alert('Failed to start camera feed. Make sure you have granted camera permissions.');
        stopCameraStream();
        if (cameraPreviewWindow) cameraPreviewWindow.classList.remove('show');
        return false;
    }
}

function captureFromLiveCameraFeed() {
    if (!cameraPreviewVideo || !cameraStream || cameraPreviewVideo.readyState < 2) {
        return null;
    }

    const canvas = document.createElement('canvas');
    canvas.width = cameraPreviewVideo.videoWidth || 1280;
    canvas.height = cameraPreviewVideo.videoHeight || 720;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(cameraPreviewVideo, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
}

async function setVisionMode(mode) {
    if (mode === 'screen') {
        stopCameraStream();
        if (cameraPreviewWindow) cameraPreviewWindow.classList.remove('show');
        visionMode = 'screen';
        await setScreenCapture(true);
    } else if (mode === 'camera') {
        await setScreenCapture(false);
        const started = await startCameraFeed();
        visionMode = started ? 'camera' : null;
    } else {
        await setScreenCapture(false);
        stopCameraStream();
        if (cameraPreviewWindow) cameraPreviewWindow.classList.remove('show');
        visionMode = null;
        if (eyeBtn) {
            eyeBtn.classList.remove('active');
            eyeBtn.title = 'Enable vision input';
        }
    }

    document.querySelectorAll('.vision-option').forEach((el) => {
        el.classList.toggle('active', el.dataset.visionType === visionMode);
    });
}

// Handle vision mode menu click to show options
if (eyeBtn) {
    eyeBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Enumerate cameras when menu opens
        enumerateCameraDevices();
        
        // Toggle vision mode menu visibility
        if (visionModeMenu) visionModeMenu.classList.toggle('show');
    });
}

// Close menu when clicking outside
document.addEventListener('click', (e) => {
    if (visionModeMenu && !visionModeMenu.contains(e.target) && e.target !== eyeBtn) {
        closeVisionMenu();
    }
});

// Handle vision mode option selection
const visionOptions = document.querySelectorAll('.vision-option');
visionOptions.forEach(option => {
    option.addEventListener('click', async () => {
        const type = option.dataset.visionType;

        if (type === visionMode) {
            await setVisionMode(null);
        } else {
            await setVisionMode(type);
        }

        closeVisionMenu();
    });
});

// Handle camera device selection
if (cameraDeviceSelect) {
    cameraDeviceSelect.addEventListener('change', async (e) => {
        selectedCameraDeviceId = e.target.value;
        if (visionMode === 'camera') {
            await startCameraFeed();
        }
    });
}

window.addEventListener('beforeunload', () => {
    stopCameraStream();
});

window.addEventListener('resize', () => {
    positionCameraPreviewWindow();
});

// Initialize on page load
window.addEventListener('load', () => {
    checkAvailableModes();
    applyOneTimeStorageReset();
    loadProjects();
    initializeWhiteboardAutosave();
    initializeChatToWhiteboardDnD();
    initializeChatImageDnDAndPaste();
    messageInput.focus();
    initializeWindowDragging();
});

// ==================== WINDOW DRAGGING & MINIMIZE ====================

function initializeWindowDragging() {
    const chatWindow = document.getElementById('chatWindow');
    const chatWindowHeader = document.getElementById('chatWindowHeader');
    const minimizeBtn = document.getElementById('minimizeBtn');
    const minimizedChat = document.getElementById('minimizedChat');
    const restoreBtn = document.getElementById('restoreBtn');
    
    let isDragging = false;
    let currentX = 0;
    let currentY = 0;
    let initialX = 0;
    let initialY = 0;
    
    // Get initial position
    const rect = chatWindow.getBoundingClientRect();
    currentX = rect.left;
    currentY = rect.top;
    
    chatWindowHeader.addEventListener('mousedown', (e) => {
        // Only drag if clicking the header directly, not buttons
        if (e.target.closest('.window-btn')) return;
        
        isDragging = true;
        initialX = e.clientX - currentX;
        initialY = e.clientY - currentY;
        
        chatWindow.style.transition = 'none';
        chatWindowHeader.style.cursor = 'grabbing';
    });
    
    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        e.preventDefault();
        
        currentX = e.clientX - initialX;
        currentY = e.clientY - initialY;
        
        // Keep window within viewport bounds
        const maxX = window.innerWidth - chatWindow.offsetWidth;
        const maxY = window.innerHeight - chatWindow.offsetHeight;
        
        currentX = Math.max(0, Math.min(currentX, maxX));
        currentY = Math.max(0, Math.min(currentY, maxY));
        
        chatWindow.style.left = currentX + 'px';
        chatWindow.style.top = currentY + 'px';
        chatWindow.style.right = 'auto';
        chatWindow.style.transform = 'none';
    });
    
    document.addEventListener('mouseup', () => {
        if (isDragging) {
            isDragging = false;
            chatWindow.style.transition = '';
            chatWindowHeader.style.cursor = 'move';
        }
    });
    
    // Minimize functionality
    minimizeBtn.addEventListener('click', () => {
        // Snap button to bottom-right corner of the chat window
        const rect = chatWindow.getBoundingClientRect();
        minimizedChat.style.left = (rect.right - 150) + 'px';
        minimizedChat.style.top = 'auto';
        minimizedChat.style.bottom = (window.innerHeight - rect.bottom + 10) + 'px';
        minimizedChat.style.right = 'auto';
        minimizedChat.style.display = 'block';
        minimizedChat.style.opacity = '0';
        minimizedChat.style.transform = 'scale(0.7)';
        minimizedChat.style.transition = 'opacity 0.25s ease, transform 0.25s ease';

        // Collapse animation: scale toward bottom-right corner
        chatWindow.style.transformOrigin = 'bottom right';
        chatWindow.classList.add('minimized');

        // Fade button in slightly after window starts shrinking
        setTimeout(() => {
            minimizedChat.style.opacity = '1';
            minimizedChat.style.transform = 'scale(1)';
        }, 80);

        // Fully hide window after animation completes
        setTimeout(() => {
            chatWindow.classList.add('hidden');
        }, 400);
    });

    // Restore functionality
    restoreBtn.addEventListener('click', () => {
        if (miniDragMoved) return; // suppress click if it was a drag

        // Get the current position of the minimized button
        const btnRect = minimizedChat.getBoundingClientRect();
        const winW = chatWindow.offsetWidth  || 400;
        const winH = chatWindow.offsetHeight || 600;

        // Align window's right edge with button's right edge
        let left = btnRect.right - winW;

        // Always open upward — clamp height if not enough room above button
        const availableH = btnRect.top - 8;
        const clampedH = Math.min(winH, availableH);
        chatWindow.style.height = clampedH + 'px';

        let top = btnRect.top - clampedH;
        let origin = 'bottom right';

        // Clamp horizontally
        left = Math.max(8, Math.min(left, window.innerWidth - winW - 8));

        // Apply position and transform-origin before un-hiding
        chatWindow.style.left   = left + 'px';
        chatWindow.style.top    = top  + 'px';
        chatWindow.style.right  = 'auto';
        chatWindow.style.bottom = 'auto';
        chatWindow.style.transformOrigin = origin;

        // Track for dragging
        currentX = left;
        currentY = top;

        // Make window visible (still in collapsed state)
        chatWindow.classList.remove('hidden');

        // Fade button out
        minimizedChat.style.opacity = '0';
        minimizedChat.style.transform = 'scale(0.7)';

        // On next frame, remove minimized class to trigger expand animation
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                chatWindow.classList.remove('minimized');
            });
        });

        // Hide button after animation
        setTimeout(() => {
            minimizedChat.style.display = 'none';
            minimizedChat.style.opacity = '1';
            minimizedChat.style.transform = 'scale(1)';
            hideNotificationDot();
        }, 400);
    });

    // ---- Minimized button dragging ----
    let isMiniDragging = false;
    let miniDragMoved = false;
    let miniStartX = 0;
    let miniStartY = 0;
    let miniOffsetX = 0;
    let miniOffsetY = 0;

    restoreBtn.addEventListener('mousedown', (e) => {
        isMiniDragging = true;
        miniDragMoved = false;
        minimizedChat.style.transition = 'none';

        // Work in terms of left/top from mouse position
        const rect = minimizedChat.getBoundingClientRect();
        miniStartX = e.clientX;
        miniStartY = e.clientY;
        miniOffsetX = e.clientX - rect.left;
        miniOffsetY = e.clientY - rect.top;

        e.stopPropagation();
    });

    document.addEventListener('mousemove', (e) => {
        if (!isMiniDragging) return;

        const dx = Math.abs(e.clientX - miniStartX);
        const dy = Math.abs(e.clientY - miniStartY);
        if (dx > 4 || dy > 4) miniDragMoved = true;

        if (!miniDragMoved) return;

        // Switch to left/top positioning
        minimizedChat.style.right = 'auto';
        minimizedChat.style.bottom = 'auto';

        let newLeft = e.clientX - miniOffsetX;
        let newTop  = e.clientY - miniOffsetY;

        // Clamp within viewport
        const bRect = minimizedChat.getBoundingClientRect();
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth  - bRect.width));
        newTop  = Math.max(0, Math.min(newTop,  window.innerHeight - bRect.height));

        minimizedChat.style.left = newLeft + 'px';
        minimizedChat.style.top  = newTop  + 'px';

        restoreBtn.style.cursor = 'grabbing';
    });

    document.addEventListener('mouseup', () => {
        if (isMiniDragging) {
            isMiniDragging = false;
            minimizedChat.style.transition = 'opacity 0.25s ease, transform 0.25s ease';
            restoreBtn.style.cursor = '';
        }
    });

    console.log('✅ Window dragging initialized');
}

function showNotificationDot() {
    const restoreBtn = document.getElementById('restoreBtn');
    if (restoreBtn && !restoreBtn.querySelector('.notification-dot')) {
        const dot = document.createElement('span');
        dot.className = 'notification-dot';
        restoreBtn.appendChild(dot);
    }
}

function hideNotificationDot() {
    const restoreBtn = document.getElementById('restoreBtn');
    const dot = restoreBtn?.querySelector('.notification-dot');
    if (dot) {
        dot.remove();
    }
}

// View Switcher
const projectInfoView = document.getElementById('projectInfoView');
const chatInputContainer = document.querySelector('.chat-input-container');
const chatControlsToggle = document.getElementById('chatControlsToggle');
const CHAT_CONTROLS_COLLAPSED_KEY = 'chatControlsCollapsed';

function setChatControlsCollapsed(collapsed) {
    if (!chatInputContainer || !chatControlsToggle) return;

    chatInputContainer.classList.toggle('controls-collapsed', collapsed);
    chatControlsToggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
    chatControlsToggle.title = collapsed
        ? 'Expand mode and agent controls'
        : 'Collapse mode and agent controls';

    if (collapsed) {
        modePopup.classList.remove('show');
        agentPopup.classList.remove('show');
    }

    localStorage.setItem(CHAT_CONTROLS_COLLAPSED_KEY, collapsed ? '1' : '0');
}

if (chatControlsToggle) {
    const initiallyCollapsed = localStorage.getItem(CHAT_CONTROLS_COLLAPSED_KEY) === '1';
    setChatControlsCollapsed(initiallyCollapsed);

    chatControlsToggle.addEventListener('click', () => {
        const collapsedNow = chatInputContainer?.classList.contains('controls-collapsed');
        setChatControlsCollapsed(!collapsedNow);
    });
}

function setChatView(view) {
    const isProjectInfo = view === 'project-info';

    // Auto-save form values to the project before leaving the project-info tab
    const currentlyOnProjectInfo = document.querySelector('.view-tab[data-view="project-info"]')?.classList.contains('active');
    if (currentlyOnProjectInfo && !isProjectInfo) {
        const activeProject = projects.find(p => p.id === currentProjectId);
        if (activeProject) {
            const formInfo = buildProductInfoFromFormValues();
            if (hasMeaningfulProductInfo(formInfo)) {
                activeProject.productInfo = mergeProductInfoClient(activeProject.productInfo || {}, formInfo);
                saveProjects();
                logProductInfoDebug('setChatView.persistOnLeave', {
                    projectId: activeProject.id,
                    formInfo: summarizeProductInfo(formInfo),
                    mergedProjectInfo: summarizeProductInfo(activeProject.productInfo)
                });
            }
        }
    }

    document.querySelectorAll('.view-tab[data-view]').forEach(t => {
        t.classList.toggle('active', t.dataset.view === view);
    });

    // Refresh themed gradients so only the current active tab is highlighted.
    if (typeof applyColors === 'function') {
        const styles = getComputedStyle(document.documentElement);
        const primary = styles.getPropertyValue('--primary-color').trim() || '#667eea';
        const secondary = styles.getPropertyValue('--secondary-color').trim() || '#764ba2';
        applyColors(primary, secondary);
    }

    chatMessages.style.display = isProjectInfo ? 'none' : 'flex';
    projectInfoView.style.display = isProjectInfo ? 'block' : 'none';
    chatInputContainer.style.display = isProjectInfo ? 'none' : 'block';

    if (isProjectInfo) {
        const projectInfoTab = document.querySelector('.view-tab[data-view="project-info"]');
        const hadAutofillBadge = !!projectInfoTab?.classList.contains('has-autofill');
        if (projectInfoTab) projectInfoTab.classList.remove('has-autofill');
        loadProductInfoToForm();

        const pendingFields = pendingAutofillFieldsByProject.get(currentProjectId) || [];
        if (hadAutofillBadge && pendingFields.length > 0) {
            revealAutofilledFields(pendingFields);
            pendingAutofillFieldsByProject.delete(currentProjectId);
            logProductInfoDebug('setChatView.revealPendingAutofill', {
                projectId: currentProjectId,
                pendingFieldCount: pendingFields.length,
                pendingFields
            });
        }
    }
}

document.querySelectorAll('.view-tab[data-view]').forEach(tab => {
    tab.addEventListener('click', () => {
        const view = tab.dataset.view;
        closeChatThreadMenu();
        setChatView(view);
    });
});

// Load product info into form
// Pass autoFilled=true when called after AI extraction to trigger tab badge + field highlights
function loadProductInfoToForm(autoFilled = false) {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject || !currentProject.productInfo) return;
    
    const info = currentProject.productInfo;

    // Track which fields change so we can highlight them
    const changedIds = [];
    function setField(id, newValue) {
        const el = getProjectInfoField(id);
        if (!el) {
            logProductInfoDebug('loadProductInfoToForm.missingField', { id, projectId: currentProject.id });
            return;
        }
        const nextValue = newValue == null ? '' : String(newValue);
        if (el.value !== nextValue) {
            changedIds.push(id);
        }
        // Always write to prevent stale-render edge cases in hidden/overlayed inputs.
        el.value = nextValue;
        el.setAttribute('value', nextValue);
        if (el.value !== nextValue) {
            logProductInfoDebug('loadProductInfoToForm.valueMismatch', {
                id,
                expected: nextValue,
                actual: el.value,
                projectId: currentProject.id
            });
            changedIds.push(id);
        }
    }
    
    setField('productName', info.productName || '');
    setField('direction', info.direction || '');

    setField('sizeDimensions', info.size?.dimensions || '');
    setField('sizeScale', info.size?.scale || '');
    setField('sizeNotes', info.size?.notes || '');

    setField('colorPalette', info.color?.palette?.join(', ') || '');
    setField('colorPrimary', info.color?.primary || '');
    setField('colorSecondary', info.color?.secondary || '');
    setField('colorNotes', info.color?.notes || '');

    setField('formShape', info.form?.shape || '');
    setField('formStyle', info.form?.style || '');
    setField('formAesthetics', info.form?.aesthetics || '');
    setField('formNotes', info.form?.notes || '');

    setField('contextUseCase', info.context?.useCase || '');
    setField('contextEnvironment', info.context?.environment || '');
    setField('contextTarget', info.context?.targetAudience || '');
    setField('contextNotes', info.context?.notes || '');

    setField('purposeFunction', info.purpose?.primaryFunction || '');
    setField('purposeProblem', info.purpose?.problemSolved || '');
    setField('purposeGoals', info.purpose?.goals?.join(', ') || '');
    setField('purposeNotes', info.purpose?.notes || '');

    setField('cmftCertifications', info.cmft?.certifications?.join(', ') || '');
    setField('cmftMaterials', info.cmft?.materials?.join(', ') || '');
    setField('cmftFinish', info.cmft?.finish || '');
    setField('cmftTesting', info.cmft?.testing?.join(', ') || '');
    setField('cmftNotes', info.cmft?.notes || '');

    setField('featuresCore', info.features?.core?.join(', ') || '');
    setField('featuresSecondary', info.features?.secondary?.join(', ') || '');
    setField('featuresInnovative', info.features?.innovative?.join(', ') || '');
    setField('featuresNotes', info.features?.notes || '');

    setField('generalNotes', info.generalNotes || '');

    if (autoFilled && changedIds.length > 0) {
        pendingAutofillFieldsByProject.set(currentProject.id, [...changedIds]);

        // Show update badge on the Project Info tab
        const projectInfoTab = document.querySelector('.view-tab[data-view="project-info"]');
        if (projectInfoTab) projectInfoTab.classList.add('has-autofill');

        // If the project-info panel is visible right now, flash the changed fields
        const activeView = document.querySelector('.view-tab[data-view].active')?.dataset.view;
        if (activeView === 'project-info') {
            revealAutofilledFields(changedIds);
            pendingAutofillFieldsByProject.delete(currentProject.id);
        }
    }

    logProductInfoDebug('loadProductInfoToForm', {
        projectId: currentProject.id,
        autoFilled,
        changedFieldCount: changedIds.length,
        changedFields: changedIds,
        productInfo: summarizeProductInfo(info)
    });
}

function hasMeaningfulProductInfo(value) {
    if (value === null || value === undefined) return false;
    if (Array.isArray(value)) return value.some(hasMeaningfulProductInfo);
    if (typeof value === 'object') return Object.values(value).some(hasMeaningfulProductInfo);
    if (typeof value === 'string') return value.trim() !== '';
    return true;
}

function buildProductInfoFromFormValues() {
    const parseList = (str) => str ? str.split(',').map(s => s.trim()).filter(s => s) : [];
    const getValue = (id) => {
        const el = getProjectInfoField(id);
        return el ? el.value.trim() : '';
    };

    return {
        productName: getValue('productName'),
        direction: getValue('direction'),
        size: {
            dimensions: getValue('sizeDimensions'),
            scale: getValue('sizeScale'),
            notes: getValue('sizeNotes')
        },
        color: {
            palette: parseList(getValue('colorPalette')),
            primary: getValue('colorPrimary'),
            secondary: getValue('colorSecondary'),
            notes: getValue('colorNotes')
        },
        form: {
            shape: getValue('formShape'),
            style: getValue('formStyle'),
            aesthetics: getValue('formAesthetics'),
            notes: getValue('formNotes')
        },
        context: {
            useCase: getValue('contextUseCase'),
            environment: getValue('contextEnvironment'),
            targetAudience: getValue('contextTarget'),
            notes: getValue('contextNotes')
        },
        purpose: {
            primaryFunction: getValue('purposeFunction'),
            problemSolved: getValue('purposeProblem'),
            goals: parseList(getValue('purposeGoals')),
            notes: getValue('purposeNotes')
        },
        cmft: {
            certifications: parseList(getValue('cmftCertifications')),
            materials: parseList(getValue('cmftMaterials')),
            finish: getValue('cmftFinish'),
            testing: parseList(getValue('cmftTesting')),
            notes: getValue('cmftNotes')
        },
        features: {
            core: parseList(getValue('featuresCore')),
            secondary: parseList(getValue('featuresSecondary')),
            innovative: parseList(getValue('featuresInnovative')),
            notes: getValue('featuresNotes')
        },
        generalNotes: getValue('generalNotes')
    };
}

function getCurrentProductInfoForRequest() {
    const fromForm = buildProductInfoFromFormValues();
    if (hasMeaningfulProductInfo(fromForm)) {
        logProductInfoDebug('getCurrentProductInfoForRequest.fromForm', summarizeProductInfo(fromForm));
        return fromForm;
    }

    const currentProject = projects.find(p => p.id === currentProjectId);
    const fallback = currentProject?.productInfo || null;
    logProductInfoDebug('getCurrentProductInfoForRequest.fromProject', summarizeProductInfo(fallback));
    return fallback;
}

// Save product info from form
document.getElementById('saveProductInfo').addEventListener('click', () => {
    const currentProject = projects.find(p => p.id === currentProjectId);
    if (!currentProject) return;

    currentProject.productInfo = buildProductInfoFromFormValues();
    
    currentProject.modified = new Date().toISOString();
    saveProjects();
    
    // Show confirmation
    const saveBtn = document.getElementById('saveProductInfo');
    const originalText = saveBtn.textContent;
    saveBtn.textContent = '✓ Saved!';
    saveBtn.style.background = 'linear-gradient(135deg, #4caf50 0%, #45a049 100%)';
    setTimeout(() => {
        saveBtn.textContent = originalText;
        saveBtn.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }, 2000);
    
    console.log('✅ Product info saved for project:', currentProject.title);
});