const { app, BrowserWindow, Tray, Menu, screen } = require('electron');
const path = require('path');
const { execFile } = require('child_process');
const fs = require('fs');

let mainWindow;
let tray;
let checkFullscreenInterval;
let isHiddenByFullscreen = false;
let isUserIntendedVisible = true;
let fadeInterval = null;

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }

app.on('second-instance', () => {
  if (mainWindow) { mainWindow.show(); positionWindow(); }
});

function positionWindow() {
  const { width } = screen.getPrimaryDisplay().workAreaSize;
  const bounds = mainWindow.getBounds();
  mainWindow.setPosition(width - bounds.width - 12, 12);
}

function fadeWindow(targetOpacity) {
  if (!mainWindow) return;

  // If we are showing it from completely hidden
  if (targetOpacity > 0 && !mainWindow.isVisible()) {
    mainWindow.setOpacity(0);
    mainWindow.showInactive();
  }

  if (fadeInterval) clearInterval(fadeInterval);

  fadeInterval = setInterval(() => {
    if (!mainWindow) { clearInterval(fadeInterval); return; }
    let current = mainWindow.getOpacity();
    if (Math.abs(current - targetOpacity) < 0.06) {
      mainWindow.setOpacity(targetOpacity);
      if (targetOpacity === 0) mainWindow.hide();
      clearInterval(fadeInterval);
    } else {
      mainWindow.setOpacity(current + (current < targetOpacity ? 0.05 : -0.05));
    }
  }, 16);
}

function startFullscreenCheck() {
  const exeProd = path.join(process.resourcesPath, 'app.asar.unpacked', 'src', 'fullscreen_check.exe');
  const exeDev = path.join(__dirname, 'fullscreen_check.exe');
  const exePath = fs.existsSync(exeProd) ? exeProd : exeDev;

  checkFullscreenInterval = setInterval(() => {
    if (!isUserIntendedVisible) return; // if user hid it manually, do nothing

    execFile(exePath, (error, stdout) => {
      if (error) return; // skip this cycle
      const isFullscreen = stdout.trim() === 'true';

      if (isFullscreen && !isHiddenByFullscreen) {
        isHiddenByFullscreen = true;
        fadeWindow(0);
      } else if (!isFullscreen && isHiddenByFullscreen) {
        isHiddenByFullscreen = false;
        // Check again so we don't fade in if user toggled while fullscreen
        if (isUserIntendedVisible) {
          fadeWindow(1);
        }
      }
    });
  }, 2000);
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 42,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    resizable: false,
    // ── KEY: hide from taskbar AND alt+tab ──────────────────────────────────
    skipTaskbar: true,
    // On Windows, 'toolbar' type removes it from the alt+tab switcher entirely
    type: 'toolbar',
    // ────────────────────────────────────────────────────────────────────────
    hasShadow: false,
    focusable: false,        // doesn't steal focus when shown
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, '..', 'assets', 'icon.ico')
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: false });

  positionWindow();

  mainWindow.on('closed', () => { mainWindow = null; });
}

function buildTrayMenu() {
  return Menu.buildFromTemplate([
    {
      label: 'Mostrar Widget',
      click: () => {
        isUserIntendedVisible = true;
        isHiddenByFullscreen = false;
        if (mainWindow) { mainWindow.setOpacity(1); mainWindow.show(); positionWindow(); }
      }
    },
    {
      label: 'Ocultar Widget',
      click: () => {
        isUserIntendedVisible = false;
        if (mainWindow) mainWindow.hide();
      }
    },
    { type: 'separator' },
    {
      label: 'Siempre encima',
      type: 'checkbox',
      checked: true,
      click: (item) => { if (mainWindow) mainWindow.setAlwaysOnTop(item.checked); }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => { app.isQuitting = true; app.quit(); }
    }
  ]);
}

function createTray() {
  const iconPath = path.join(__dirname, '..', 'assets', 'tray.png');
  tray = new Tray(iconPath);
  tray.setToolTip('CryptoWidget');
  tray.setContextMenu(buildTrayMenu());

  // Left click: toggle widget visibility
  tray.on('click', () => {
    if (!mainWindow) return;
    if (mainWindow.isVisible()) {
      isUserIntendedVisible = false;
      mainWindow.hide();
    } else {
      isUserIntendedVisible = true;
      isHiddenByFullscreen = false;
      mainWindow.setOpacity(1);
      mainWindow.show();
      positionWindow();
    }
  });
}

app.whenReady().then(() => {
  // Disable the app from showing in the taskbar at OS level
  app.setAppUserModelId('com.cryptowidget.app');

  createWindow();
  createTray();
  startFullscreenCheck();
});

// Keep running when all windows are closed (lives in tray)
app.on('window-all-closed', (e) => {
  if (!app.isQuitting) {
    // intentionally do nothing — keep tray alive
  }
});

app.on('before-quit', () => {
  app.isQuitting = true;
  if (tray) tray.destroy();
});
