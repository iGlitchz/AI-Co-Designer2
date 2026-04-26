# SimpleChatbot: AI Co-Designer System

SimpleChatbot is a design-oriented AI collaboration environment built around multimodal, human-led design communication.

## Core Principle

AI design tools should not only generate outputs. They should help designers communicate intent, constraints, artifacts, style, and critique across the full design process.

## Features

- Phase modes: Ideation, Conceptualization, Execution
- Specialist design agents
- Text, voice, image, camera, and screen inputs
- Whiteboard-based artifact workflow
- Project memory and design context
- AI image generation and remixing
- TTS output
- Electron desktop overlay mode

## Setup

1. Clone the repository.
2. Install dependencies:
```bash
npm install
```
3. Copy `.env.example` to `.env` and add your own API keys.
4. Start the app:
```bash
npm start
```

For desktop mode in development:

```bash
npm run app
```

Build a Windows installer:

```bash
npm run dist:win
```

## Environment Variables

Set these in `.env`:

- `OPENROUTER_API_KEY`
- `GOOGLE_CLOUD_VISION_API_KEY`
- `RUNWARE_API_KEY`
- `RUNWARE_IMAGE_MODEL`

## Security and Architecture

- Never hardcode API keys.
- Keep paid API calls server-side only.
- The browser should call backend endpoints such as:
	- `/api/chat`
	- `/api/chat/stream`
	- `/api/generate-image`
	- `/api/tts`

## Public Positioning

The first open-source AI co-designer grounded in design communication principles: multimodal, phase-aware, artifact-grounded, and human-led.

## Project Files

- `server.js` - Express backend APIs
- `public/` - Frontend UI assets
- `electron/main.js` - Desktop wrapper that launches the backend + app window