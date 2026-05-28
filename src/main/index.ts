import { app, shell, BrowserWindow, nativeImage } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import log from 'electron-log/main'

log.initialize()
log.transports.file.level = 'warn'
log.transports.console.level = is.dev ? 'debug' : false
import { initDb, closeDb, backupDb } from './db/database'
import './ipc/dbHandlers'
import './ipc/migrationHandlers'
import './ipc/planvariantHandlers'
import './ipc/treeHandlers'
import './ipc/linksHandlers'
import './ipc/settingsHandlers'
import './ipc/mailHandlers'
import './ipc/calendarHandlers'
import './ipc/exportHandlers'
import './ipc/googleCalHandlers'
import './ipc/fcmHandlers'
import './ipc/terminHandlers'
import './ipc/recurringHandlers'
import './ipc/backupHandlers'
import './ipc/jsonHandlers'
import './ipc/licenseHandlers'
import './ipc/myDataHandlers'
import './ipc/helpHandlers'
import { scheduleUpdateCheck } from './ipc/updateHandlers'

function resolveWindowIcon(): Electron.NativeImage | undefined {
  try {
    const iconPath = is.dev
      ? join(app.getAppPath(), 'build', 'icon.ico')
      : join(__dirname, '../../build', 'icon.ico')
    const img = nativeImage.createFromPath(iconPath)
    return img.isEmpty() ? undefined : img
  } catch {
    return undefined
  }
}

function createWindow(): void {
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    icon: resolveWindowIcon(),
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  electronApp.setAppUserModelId('com.fancyplan')

  initDb()
  try { backupDb() } catch { /* ignore if db not yet present */ }

  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  createWindow()
  scheduleUpdateCheck()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  closeDb()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
