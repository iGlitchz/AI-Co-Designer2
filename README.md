# AI CO-DESIGNER: A FRAMEWORK FOR ARTIFICIAL INTELLIGENCE AND INDUSTRIAL DESIGN COLLABORATION

SimpleChatbot is a design-oriented AI collaboration environment built around multimodal, human-led design communication.

## Core Principle

AI design tools should not only generate outputs. They should help designers communicate intent, constraints, prototypes, style, and critique across the full design process.

## Features

- Phase modes: Ideation, Conceptualization, Execution
- Specialist design agents
- Text, voice, image, camera, and screen inputs
- Whiteboard-based prototype workflow
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

For desktop mode in development:

```bash
npm run app
```

### Overlay Mode (Float on Top of Any App)

`npm run bubble` launches a compact floating overlay window that stays on top of all other applications. Use this to keep the AI co-designer visible while working in Figma, Rhino, Illustrator, or any other tool.

```bash
npm run bubble
```

Steps:
1. Run `npm run bubble` in the terminal.
2. The overlay window will appear in the top-right corner of your screen.
3. It floats above all other open applications — switch to any app and the overlay remains visible.
4. Use the overlay to send messages, capture screenshots, and receive AI feedback without leaving your design tool.
5. To close, click the X button on the overlay or stop the terminal process with `Ctrl+C`.

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