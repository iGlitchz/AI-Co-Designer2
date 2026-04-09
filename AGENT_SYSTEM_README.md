# Agent System Documentation

## Overview
The Co-Designer app now supports specialized AI agents that provide expert analysis from different perspectives. Agents have access to project context and specialized knowledge resources.

## Folder Structure

### `/project_context/`
Stores information about your current project that agents can reference.

- **`product_info.json`** - Central repository for project details including:
  - Product name and direction
  - Size, dimensions, and scale
  - Color palette and aesthetics
  - Form, shape, and style
  - Context and use cases
  - Purpose and goals
  - CMFT specifications (Color, Material, Finish, Texture)
  - Features and capabilities
  - General notes

**How to use:** Edit the JSON file to add your project information. Agents will automatically reference this data when formulating responses.

### `/agent_resources/`
Contains specialized knowledge bases for each agent. These markdown files define the agent's expertise, frameworks, and reference materials.

#### Available Agents:

1. **Ergonomics Agent** (`ergonomics_agent.md`)
   - Human-centered design expert
   - Anthropometric data and biomechanics
   - Accessibility standards
   - Posture, comfort, and usability

2. **Brand Master** (`brand_master.md`)
   - Brand strategy and identity specialist
   - Visual language and consistency
   - Color psychology
   - Brand positioning and differentiation

3. **Design Researcher** (`design_researcher.md`)
   - User research methodologies
   - Trend analysis and forecasting
   - Competitive research
   - Design thinking frameworks

4. **CMFT Expert** (`cmft_expert.md`)
   - Material science and selection
   - Surface finishing techniques
   - Manufacturing processes
   - Color, Material, Finish, Texture expertise

**How to customize:** Edit each agent's markdown file to add:
- Specific standards or guidelines relevant to your project
- Company-specific design principles
- Custom data sets or metrics
- Reference materials and benchmarks
- Industry-specific requirements

## Using Agents in the Chat

### Activating Agents

1. In the chat interface, click the **"Agents"** button (shows count of selected agents)
2. A popup will display all available agents
3. Check the boxes for agents you want to consult (you can select multiple)
4. The agent count badge will update to show how many are selected

### Agent Responses

When agents are selected:
- Your question is enriched with project context from `product_info.json`
- Each agent provides analysis from their specialized perspective
- Agents use their knowledge resources and frameworks
- Agents reference any images you've attached (via Vision API)
- Responses integrate insights from all selected agents

### Best Practices

**For General Questions:**
- Select 1-2 relevant agents for focused advice
- Example: Brand Master + CMFT Expert for color palette decisions

**For Complex Analysis:**
- Select multiple agents for comprehensive feedback
- Example: All agents for reviewing a complete design concept

**With Images:**
- Agents can analyze whiteboard sketches, prototypes, or reference images
- The Vision API provides visual context that agents incorporate into their analysis

**Updating Project Context:**
- Keep `product_info.json` updated as your project evolves
- More detailed context → more specific and relevant agent advice

## Example Workflows

### 1. Material Selection
- **Agents:** CMFT Expert, Ergonomics Agent
- **Context:** Add material requirements to `product_info.json`
- **Question:** "What material would work best for this product?"

### 2. Brand Alignment Check
- **Agents:** Brand Master
- **Context:** Define brand colors/values in `product_info.json`
- **Question:** "Does this design align with our brand identity?"

### 3. Comprehensive Design Review
- **Agents:** All 4 agents
- **Context:** Complete product information
- **Question:** "Review this design from all perspectives"
- **Attach:** Screenshot from whiteboard

### 4. Usability Assessment
- **Agents:** Ergonomics Agent, Design Researcher
- **Context:** Use case and audience in `product_info.json`
- **Question:** "Is this design comfortable and user-friendly?"

## Tips for Best Results

1. **Be Specific:** The more detailed your question, the better the agent responses
2. **Update Context:** Keep project information current in `product_info.json`
3. **Use Images:** Attach whiteboard screenshots for visual context
4. **Customize Resources:** Add your own data to agent markdown files
5. **Combine Agents:** Different perspectives reveal different insights
6. **Iterate:** Use agent feedback to refine designs, then ask follow-up questions

## Technical Details

- Agents are implemented server-side in `server.js`
- Agent resources are loaded dynamically when agents are selected
- Project context is merged with mode-specific prompts
- Vision API analysis is shared across all selected agents
- Responses integrate all agent perspectives cohesively
