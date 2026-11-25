import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import type {Group} from '../../src/shared/types'

test('游戏卡片显示版本号，历史版本保留原编号并以虚线区分',async()=>{
 const now=Date.parse('2026-11-26T12:00:00+08:00'),day=86400000
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_NOW:String(now),TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-card-version-'))}})
 try{
  const page=await app.firstWindow();await page.waitForSelector('nav')
  await page.evaluate(async({now,day})=>{
   const game=(await window.todo.call<Group>('addGroup',{kind:'game',name:'卡片版本游戏',version:{number:'1.0',start:now-10*day,end:now+day}})).data!
   const base={kind:'game',cat:game.id,start:now-day,end:now+day,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'}
   await window.todo.call('save',{input:{...base,name:'上版本活动'}})
   await window.todo.call('updateGame',{id:game.id,name:game.name,version:{number:'2.0',start:now,end:now+20*day}})
   await window.todo.call('save',{input:{...base,name:'本版本活动',start:now,end:now+2*day}})
   await window.todo.call('save',{input:{...base,name:'未知版本活动',start:now+21*day,end:now+22*day}})
  },{now,day})
  await page.locator('nav').getByRole('button',{name:'卡片版本游戏',exact:true}).click()
  await page.getByRole('button',{name:'全部',exact:true}).click()
  const historical=page.locator('.task-row').filter({has:page.getByRole('button',{name:'上版本活动',exact:true})})
  const current=page.locator('.task-row').filter({has:page.getByRole('button',{name:'本版本活动',exact:true})})
  await expect(historical.locator('.card-top .activity-version')).toHaveText('1.0')
  await expect(historical).not.toContainText('非当前版本')
  await expect(historical).toHaveCSS('border-top-style','dashed')
  await expect(current.locator('.card-top .activity-version')).toHaveText('2.0')
  await expect(current.locator('.card-top .activity-card-tags')).toHaveText('卡片版本游戏2.0')
  const badge=await current.locator('.activity-version').boundingBox(),name=await current.locator('.activity-card-tags > span').first().boundingBox()
  expect(badge!.x).toBeGreaterThanOrEqual(name!.x+name!.width)
  expect(Math.abs(badge!.y-name!.y)).toBeLessThan(8)
  await expect(current).not.toContainText('非当前版本')
  await expect(current).not.toHaveCSS('border-top-style','dashed')
  const unknown=page.locator('.task-row').filter({has:page.getByRole('button',{name:'未知版本活动',exact:true})})
  await expect(unknown.locator('.activity-version')).toHaveText('版本未标注')
  await unknown.getByRole('button',{name:'未知版本活动',exact:true}).click()
  await page.getByRole('button',{name:'编辑',exact:true}).click()
  await page.getByLabel('活动版本号（可留空）').fill('3.0')
  await page.getByRole('button',{name:'保存',exact:true}).click()
  await expect(unknown.locator('.activity-version')).toHaveText('3.0')
  await expect(unknown).toHaveCSS('border-top-style','dashed')
  await page.locator('nav').getByRole('button',{name:'首页',exact:true}).click()
  await expect(page.locator('.activity-version')).toHaveCount(0)
 }finally{await app.close()}
})
