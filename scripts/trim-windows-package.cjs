const { rm } = require('node:fs/promises')
const { join } = require('node:path')

module.exports = async ({ electronPlatformName, appOutDir }) => {
  if (electronPlatformName !== 'win32') return
  // A pre-extracted Electron distribution retains these two unused files.
  await Promise.all([
    rm(join(appOutDir, 'version'), { force: true }),
    rm(join(appOutDir, 'resources', 'default_app.asar'), { force: true }),
  ])
}
