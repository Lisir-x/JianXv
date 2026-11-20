import {test,expect,_electron as electron} from '@playwright/test'
import {existsSync,mkdirSync,mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'

test('Windows 任务栏只刷新属于笺序的旧固定快捷方式',async()=>{
 test.skip(process.platform!=='win32','Windows taskbar only')
 const dir=mkdtempSync(join(tmpdir(),'jianxu-pins-')),pins=join(dir,'pinned-taskbar')
 mkdirSync(pins)
 const packaged=process.env.JIANXU_USE_PACKAGED==='1'
 const executablePath=resolve('release/win-unpacked/笺序.exe')
 if(packaged)expect(existsSync(executablePath)).toBe(true)
 const launch=()=>electron.launch({...(packaged?{executablePath,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
 let app=await launch()
 try{
  await app.firstWindow()
  await app.evaluate(({app,shell},pins)=>{
   const exe=app.getPath('exe')
   for(const [file,id] of [['笺序.lnk','local.personal.todo'],['其他应用.lnk','com.example.other']]){
    if(!shell.writeShortcutLink(`${pins}\\${file}`,'create',{target:exe,appUserModelId:id,args:'--background',description:'Test shortcut'}))throw Error('Failed to create a test shortcut')
   }
  },pins)
  if(packaged)await app.evaluate(({app,shell},{pins,legacy})=>{
   if(!shell.writeShortcutLink(`${pins}\\旧版笺序.lnk`,'create',{target:legacy,appUserModelId:'local.personal.todo',cwd:app.getAppPath()}))throw Error('Failed to create legacy shortcut')
  },{pins,legacy:resolve('release/win-unpacked/我的待办.exe')})
  await app.close()
  app=await launch()
  const page=await app.firstWindow()
  await page.waitForSelector('nav')
  const [ours,other]=await app.evaluate(({shell},pins)=>['笺序.lnk','其他应用.lnk'].map(file=>shell.readShortcutLink(`${pins}\\${file}`)),pins)
  const icon=resolve(packaged?'release/win-unpacked/resources/jianxu-taskbar.ico':'assets/icon.ico')
  expect(ours).toMatchObject({icon,iconIndex:0,appUserModelId:'local.personal.todo',args:'--background',description:'Test shortcut'})
  expect(other).toMatchObject({icon:'',appUserModelId:'com.example.other',args:'--background'})
  if(packaged){
   const legacy=await app.evaluate(({shell},pins)=>shell.readShortcutLink(`${pins}\\旧版笺序.lnk`),pins)
   expect(legacy).toMatchObject({target:executablePath,icon,iconIndex:0,appUserModelId:'local.personal.todo',cwd:resolve('release/win-unpacked')})
  }
 }finally{await app.close()}
})

test('离线宋体以粗字重加载，主按钮显示独立的悬停与按压反馈',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jianxu-paper-controls-'))
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
 try{
  const page=await app.firstWindow()
  await page.waitForSelector('nav')
  const title=page.locator('h1')
  await expect(title).toHaveCSS('font-weight','750')
  expect(await title.evaluate(async el=>{
   const [face]=await document.fonts.load(`750 26px "Jianxu Serif"`,el.textContent??'')
   return face?.status
  })).toBe('loaded')
  const add=page.getByRole('button',{name:'＋ 新增',exact:true})
  const box=await add.boundingBox()
  await page.locator('.brand').hover()
  const resting=await add.evaluate(el=>getComputedStyle(el).backgroundImage)
  expect(resting).toContain('linear-gradient')
  await add.hover()
  expect(await add.evaluate(el=>getComputedStyle(el).backgroundImage)).not.toBe(resting)
  const hoverShadow=await add.evaluate(el=>getComputedStyle(el).boxShadow)
  await page.mouse.down()
  expect(await add.evaluate(el=>getComputedStyle(el).boxShadow)).not.toBe(hoverShadow)
  expect(await add.boundingBox()).toEqual(box)
  await page.mouse.up()
  await expect(page.getByRole('dialog')).toBeVisible()
 }finally{await app.close()}
})
