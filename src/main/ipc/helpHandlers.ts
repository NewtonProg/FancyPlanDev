import { ipcMain, BrowserWindow, app } from 'electron'
import { join } from 'path'
import { readFileSync, writeFileSync, existsSync } from 'fs'
import { tmpdir } from 'os'
import { is } from '@electron-toolkit/utils'

function getHelpPath(key: string, lang: string): string {
  if (is.dev) {
    return join(app.getAppPath(), 'resources', 'help', lang, `${key}.md`)
  }
  return join(process.resourcesPath, 'help', lang, `${key}.md`)
}

function wrapHtml(body: string): string {
  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>FancyPlan Hilfe</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:14px;line-height:1.65;
       background:#0a1220;color:#c8d3e8;padding:28px 32px;max-width:720px;margin:0 auto}
  h1{font-size:19px;font-weight:600;color:#e2e8f4;margin-bottom:6px}
  h2{font-size:13px;font-weight:600;color:#7a9cc0;margin-top:28px;margin-bottom:8px;
     text-transform:uppercase;letter-spacing:.07em}
  h3{font-size:14px;font-weight:600;color:#a8c0dc;margin-top:18px;margin-bottom:6px}
  p{margin-bottom:10px}
  ul,ol{padding-left:20px;margin-bottom:10px}
  li{margin-bottom:4px}
  strong{color:#d8e8fa}
  code{background:#131f33;border:1px solid #253550;border-radius:4px;
       padding:1px 5px;font-size:12px;font-family:monospace;color:#6ea8e0}
  hr{border:none;border-top:1px solid #1a2d48;margin:20px 0}
  table{width:100%;border-collapse:collapse;margin-bottom:12px;font-size:13px}
  th{text-align:left;padding:6px 10px;background:#131f33;color:#7a9cc0;
     font-weight:600;border-bottom:1px solid #253550}
  td{padding:6px 10px;border-bottom:1px solid #192640;vertical-align:top}
  tr:hover td{background:#0f1c30}
  blockquote{border-left:3px solid #3b6eb0;background:#0f1c30;padding:10px 14px;
             border-radius:0 6px 6px 0;margin:12px 0;font-size:13px;color:#9ab8d4}
</style>
</head>
<body>${body}</body>
</html>`
}

ipcMain.handle('help:open', async (_event, key: string, lang = 'de') => {
  const mdPath = getHelpPath(key, lang)
  if (!existsSync(mdPath)) return

  const md = readFileSync(mdPath, 'utf-8')
  const { marked } = await import('marked')
  const body = String(await marked(md))
  const html  = wrapHtml(body)

  const tmpPath = join(tmpdir(), `fp-help-${key}-${lang}.html`)
  writeFileSync(tmpPath, html, 'utf-8')

  const win = new BrowserWindow({
    width: 740, height: 640,
    autoHideMenuBar: true,
    title: 'FancyPlan Hilfe',
    webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false }
  })
  win.loadFile(tmpPath)
})
