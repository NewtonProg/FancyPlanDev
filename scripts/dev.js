// Unsets ELECTRON_RUN_AS_NODE before spawning electron-vite dev.
// Required when running from environments like Claude Code that set this variable.
const { spawn } = require('child_process')

delete process.env.ELECTRON_RUN_AS_NODE

const child = spawn('npx', ['electron-vite', 'dev'], {
  stdio: 'inherit',
  shell: true,
  env: process.env
})

child.on('exit', (code) => process.exit(code ?? 0))
