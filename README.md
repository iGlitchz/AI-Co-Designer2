# SimpleChatbot Desktop App

SimpleChatbot can run as both:

- a web app (`npm start`)
- a desktop app on Windows (`npm run app` and packaged installer)

## Quick Start

1. Install dependencies:
```bash
npm install
```

2. Run as desktop app (development mode):
```bash
npm run app
```

Desktop behavior:

- The app launches as an always-on-top window so it stays accessible while you use other apps.
- Global quick-toggle shortcut: `Ctrl+Shift+Space` (hide/show + focus the chatbot window).
- Screen capture input can be enabled from the eye icon in the chat header.

3. Build a Windows installer (`.exe`):
```bash
npm run dist:win
```

4. Find your downloadable installer in:
`dist/`

## API Keys

Create/update `.env` in the project root and set the keys you use:

- `MISTRAL_API_KEY`
- `GOOGLE_CLOUD_VISION_API_KEY` (optional)
- `RUNWARE_API_KEY` (optional, for image generation)

## Project Files

- `server.js` - Express backend APIs
- `public/` - Frontend UI assets
- `electron/main.js` - Desktop wrapper that launches the backend + app window