const { app, BrowserWindow, Menu, dialog, globalShortcut, screen, ipcMain, desktopCapturer } = require('electron');
const path = require('path');
const { fork } = require('child_process');
const http = require('http');

const PORT = Number(process.env.PORT || 3001);
const SERVER_URL = `http://127.0.0.1:${PORT}`;
const QUICK_TOGGLE_SHORTCUT = 'CommandOrControl+Shift+Space';

// Pass --mode=bubble on the command line to open the bubble window instead.
const IS_BUBBLE_MODE = process.argv.includes('--mode=bubble');

let mainWindow = null;
let serverProcess = null;

// Minimize bubble window when renderer requests it via IPC
ipcMain.on('minimize-window', () => {
  if (mainWindow && !mainWindow.isDestroyed()) mainWindow.minimize();
});

// Allow renderer to toggle click-through on transparent areas
ipcMain.on('set-ignore-mouse-events', (event, ignore, options) => {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.setIgnoreMouseEvents(ignore, options || {});
  }
});

// Capture what is behind the window: hide → screenshot → restore
ipcMain.handle('capture-behind-window', async () => {
  if (!mainWindow || mainWindow.isDestroyed()) return null;

  const { width, height } = screen.getPrimaryDisplay().size;

  // Hide window so it doesn't appear in the screenshot
  mainWindow.hide();
  // Wait for the OS compositor to finish hiding it
  await new Promise(resolve => setTimeout(resolve, 150));

  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: { width, height }
    });
    const primary = sources[0];
    if (!primary) return null;
    return primary.thumbnail.toDataURL();
  } finally {
    mainWindow.show();
    mainWindow.focus();
  }
});

function toggleMainWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) return;

  if (mainWindow.isVisible() && mainWindow.isFocused()) {
    mainWindow.hide();
    return;
  }

  mainWindow.show();
  mainWindow.focus();
}

function waitForServer(url, timeoutMs = 20000) {
  const startedAt = Date.now();

  return new Promise((resolve, reject) => {
    const attempt = () => {
      const req = http.get(url, (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 500) {
          resolve();
          return;
        }

        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('Server did not become ready in time.'));
          return;
        }

        setTimeout(attempt, 400);
      });

      req.on('error', () => {
        if (Date.now() - startedAt > timeoutMs) {
          reject(new Error('Server did not become ready in time.'));
          return;
        }
        setTimeout(attempt, 400);
      });
    };

    attempt();
  });
}

function startBackendServer() {
  if (serverProcess) return;

  const serverPath = path.join(app.getAppPath(), 'server.js');

  serverProcess = fork(serverPath, [], {
    cwd: app.getAppPath(),
    env: {
      ...process.env,
      PORT: String(PORT)
    },
    stdio: 'inherit'
  });

  serverProcess.on('exit', (code, signal) => {
    console.log(`Backend exited (code=${code}, signal=${signal})`);
    serverProcess = null;
  });
}

async function createMainWindow() {
  startBackendServer();

  try {
    await waitForServer(SERVER_URL);
  } catch (error) {
    dialog.showErrorBox('Startup Error', `Could not start backend server. ${error.message}`);
    app.quit();
    return;
  }

  if (IS_BUBBLE_MODE) {
    await createBubbleWindow();
  } else {
    await createFullWindow();
  }
}

// ── Full whiteboard + chat window ────────────────────────────────────────────
async function createFullWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 960,
    minHeight: 640,
    title: 'SimpleChatbot',
    autoHideMenuBar: true,
    alwaysOnTop: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setFullScreenable(false);

  mainWindow.loadURL(SERVER_URL);

  mainWindow.on('closed', () => { mainWindow = null; });

  const shortcutRegistered = globalShortcut.register(QUICK_TOGGLE_SHORTCUT, toggleMainWindow);
  if (!shortcutRegistered) {
    console.warn(`Could not register global shortcut: ${QUICK_TOGGLE_SHORTCUT}`);
  }
}

// ── Compact bubble window (chat only, no whiteboard) ─────────────────────────
async function createBubbleWindow() {
  const { width: screenW, height: screenH } = screen.getPrimaryDisplay().workAreaSize;

  // Full-screen transparent: the chat panel is a fixed-position widget inside the page,
  // just like the floating chat window on the web whiteboard version.
  mainWindow = new BrowserWindow({
    width: screenW,
    height: screenH,
    x: 0,
    y: 0,
    title: 'Co-Designer',
    frame: false,
    transparent: true,
    backgroundColor: '#00000000',
    skipTaskbar: true,
    alwaysOnTop: true,
    resizable: false,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
      sandbox: false
    }
  });

  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  mainWindow.setFullScreenable(false);
  // Completely remove the menu bar so it never appears
  mainWindow.setMenu(null);

  mainWindow.loadURL(`${SERVER_URL}/bubble.html`);

  // Make transparent areas click-through immediately
  mainWindow.setIgnoreMouseEvents(true, { forward: true });

  // Wait for content to be ready, then show to avoid rendering artifacts
  mainWindow.webContents.on('did-finish-load', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  mainWindow.on('closed', () => { mainWindow = null; });

  const shortcutRegistered = globalShortcut.register(QUICK_TOGGLE_SHORTCUT, toggleMainWindow);
  if (!shortcutRegistered) {
    console.warn(`Could not register global shortcut: ${QUICK_TOGGLE_SHORTCUT}`);
  }
}

function stopBackendServer() {
  if (!serverProcess) return;

  try {
    serverProcess.kill();
  } catch (error) {
    console.error('Failed to stop backend server:', error.message);
  }

  serverProcess = null;
}

app.on('ready', () => {
  if (IS_BUBBLE_MODE) {
    Menu.setApplicationMenu(null);
  }
  createMainWindow();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createMainWindow();
  }
});

app.on('before-quit', stopBackendServer);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
});
