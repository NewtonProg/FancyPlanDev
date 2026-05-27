import { ipcMain, BrowserWindow } from 'electron'
import { autoUpdater } from 'electron-updater'
import { is } from '@electron-toolkit/utils'

type UpdateStatus = 'idle' | 'checking' | 'available' | 'not-available' | 'downloading' | 'downloaded' | 'error'

interface UpdateEvent {
  status: UpdateStatus
  version?: string
  progress?: number
  message?: string
}

let currentEvent: UpdateEvent = { status: 'idle' }

function broadcast(event: UpdateEvent): void {
  currentEvent = event
  BrowserWindow.getAllWindows().forEach((w) =>
    w.webContents.send('update:event', event)
  )
}

if (!is.dev) {
  autoUpdater.autoDownload = true
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => broadcast({ status: 'checking' }))
  autoUpdater.on('update-available', (info) =>
    broadcast({ status: 'available', version: info.version })
  )
  autoUpdater.on('update-not-available', () => broadcast({ status: 'not-available' }))
  autoUpdater.on('download-progress', (p) =>
    broadcast({ status: 'downloading', progress: Math.round(p.percent) })
  )
  autoUpdater.on('update-downloaded', (info) =>
    broadcast({ status: 'downloaded', version: info.version })
  )
  autoUpdater.on('error', (err) =>
    broadcast({ status: 'error', message: err.message })
  )
}

ipcMain.handle('update:check', async () => {
  if (is.dev) return currentEvent
  try {
    await autoUpdater.checkForUpdates()
  } catch { /* errors caught via event */ }
  return currentEvent
})

ipcMain.handle('update:status', () => currentEvent)

ipcMain.handle('update:install', () => {
  if (currentEvent.status === 'downloaded') {
    autoUpdater.quitAndInstall()
  }
})

export function scheduleUpdateCheck(): void {
  if (!is.dev) {
    setTimeout(() => {
      autoUpdater.checkForUpdates().catch(() => { /* silent */ })
    }, 5000)
  }
}
