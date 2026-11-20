const { build, Platform, Arch } = require('electron-builder')
const { existsSync, mkdirSync, mkdtempSync, renameSync, rmdirSync } = require('node:fs')
const { join, resolve } = require('node:path')

async function main() {
  const projectDir = resolve(__dirname, '..')
  const release = join(projectDir, 'release')
  const unpacked = join(release, 'win-unpacked')
  for (const name of ['我的待办数据', 'todo-location.json']) {
    const path = join(unpacked, name)
    if (existsSync(path)) throw Error(`请先保护旧数据或位置配置，再更新 release：${path}`)
  }
  const unpackOnly = process.argv.includes('--dir')
  const temporary = join(projectDir, '.test-data')
  mkdirSync(temporary, { recursive: true })
  const protection = mkdtempSync(join(temporary, 'release-data-'))
  const saved = []
  try {
    for (const name of ['data', 'location.json']) {
      if (!existsSync(join(unpacked, name))) continue
      renameSync(join(unpacked, name), join(protection, name))
      saved.push(name)
    }
    const artifacts = await build({
      projectDir,
      targets: Platform.WINDOWS.createTarget(unpackOnly ? 'dir' : 'nsis', Arch.x64),
      publish: 'never',
    })
    if (unpackOnly) console.log(unpacked)
    else if (!artifacts.includes(join(release, '我的待办 Setup.exe'))) throw Error('Windows installer was not produced')
  } finally {
    if (saved.length) mkdirSync(unpacked, { recursive: true })
    for (const name of saved) {
      const target = join(unpacked, name)
      if (existsSync(target)) throw Error(`无法恢复数据，原件仍保留在 ${protection}`)
      renameSync(join(protection, name), target)
    }
    rmdirSync(protection)
  }
}

main().catch(error => { console.error(error); process.exitCode = 1 })
