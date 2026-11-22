import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('总览、独立侧栏滚动、状态筛选与打卡持久化',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jianxu-v15-'))
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}}
 let app=await electron.launch(options)
 try{
  let page=await app.firstWindow()
  const invoke=async(action:string,payload:unknown={})=>page.evaluate(async({action,payload})=>{const result=await window.todo.call(action,payload);if(!result.ok)throw Error(result.error);return result.data},{action,payload})
  const now=Date.now(),zone=Intl.DateTimeFormat().resolvedOptions().timeZone
  const g=await invoke('addGroup',{kind:'game',name:'测试游戏'}) as {id:string}
  for(let i=0;i<10;i++){await invoke('addGroup',{kind:'study',name:`分类${i}`});await invoke('addGroup',{kind:'game',name:`游戏${i}`})}
  await invoke('save',{input:{kind:'game',cat:g.id,name:'最近活动',start:now-1000,end:now+86400000,remind:null,desc:'',reward:'',period:0,zone}})
  await invoke('save',{input:{kind:'game',cat:g.id,name:'超期活动',start:now-86400000,end:now-1000,remind:null,desc:'',reward:'',period:0,zone}})
  await page.getByRole('button',{name:'游戏',exact:true}).click()
  await expect(page.getByRole('heading',{name:'游戏总览'})).toBeVisible()
  await expect(page.getByRole('region',{name:'游戏最近一项'})).toContainText('最近活动')
  const study=page.locator('#nav-study'),games=page.locator('#nav-game')
  const before=await study.evaluate(e=>e.scrollTop);await study.hover();await page.mouse.wheel(0,300);await expect.poll(()=>study.evaluate(e=>e.scrollTop)).toBeGreaterThan(before)
  expect(await games.evaluate(e=>e.scrollTop)).toBe(0)
  const thumb=page.getByRole('scrollbar',{name:'滚动学习子模块'});await expect(thumb).toBeVisible();await thumb.focus();await page.keyboard.press('Home');await expect.poll(()=>study.evaluate(e=>e.scrollTop)).toBe(0);await page.keyboard.press('End');await expect.poll(()=>study.evaluate(e=>e.scrollTop)).toBeGreaterThan(0)
  await expect(page.getByRole('button',{name:'首页',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'设置',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'退出应用'})).toBeVisible()
  await page.getByRole('button',{name:'已超期',exact:true}).click();await expect(page.getByRole('region',{name:'游戏最近一项'})).toHaveCount(0);await expect(page.getByRole('button',{name:'超期活动',exact:true})).toBeVisible();await expect(page.getByRole('button',{name:'最近活动',exact:true})).toHaveCount(0)
  await page.getByRole('button',{name:'待完成',exact:true}).click();await expect(page.getByRole('button',{name:'最近活动',exact:true})).toHaveCount(1)
  await page.getByRole('button',{name:'总览',exact:true}).click();await page.getByRole('button',{name:'测试游戏：已超期 1 项'}).click();await expect(page.getByRole('heading',{name:'测试游戏'})).toBeVisible();await expect(page.getByRole('button',{name:'已超期',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'日常／周常'}).click();await page.getByRole('button',{name:'刷新设置'}).click();const modal=page.getByRole('dialog',{name:'刷新设置'});await modal.getByRole('button',{name:'保存'}).click()
  await page.getByRole('button',{name:'新增任务'}).click();const editor=page.getByRole('dialog',{name:'新增打卡任务'});await editor.getByLabel('任务名称').fill('每日补给');await editor.getByRole('button',{name:'保存'}).click();await page.getByRole('checkbox',{name:'每日补给'}).check();await expect(page.getByRole('checkbox',{name:'每日补给'})).toBeChecked()
  await page.getByRole('button',{name:'刷新设置'}).click();await modal.getByLabel('日常 · 每天刷新时间').fill('06:30');await modal.getByRole('button',{name:'取消'}).click();const discard=page.getByRole('dialog',{name:'放弃未保存的修改？'});await expect(discard).toBeVisible();await discard.getByRole('button',{name:'取消'}).click();await expect(modal.getByLabel('日常 · 每天刷新时间')).toHaveValue('06:30');await modal.getByRole('button',{name:'保存'}).click();await expect(page.getByRole('checkbox',{name:'每日补给'})).not.toBeChecked();await page.getByRole('checkbox',{name:'每日补给'}).check()
  await app.close();app=await electron.launch(options);page=await app.firstWindow();const snap=await invoke('snapshot') as {routines:{name:string;done:boolean}[]};expect(snap.routines).toEqual(expect.arrayContaining([expect.objectContaining({name:'每日补给',done:true})]))
 }finally{await app.close()}
})
