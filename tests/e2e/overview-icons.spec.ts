import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('总览及打卡视图显示设计图中的功能图标',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jianxu-icons-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:'超期',start:null,end:s.now-1000,remind:null,desc:'',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone}});await window.todo.call('addGroup',{kind:'game',name:'图标游戏'})})
  await expect(page.locator('.topbar [data-icon="bell"]')).toBeVisible()
  await page.getByRole('button',{name:'学习',exact:true}).click()
  for(const icon of ['bookmark','calendarClock','list','clock'])await expect(page.locator(`.module-overview [data-icon="${icon}"]`)).toBeVisible()
  await page.getByRole('button',{name:'游戏',exact:true}).click()
  for(const icon of ['bookmark','calendarClock','list','checklist'])await expect(page.locator(`.module-overview [data-icon="${icon}"]`)).toBeVisible()
  await expect(page.getByRole('button',{name:'活动日历'}).locator('[data-icon="calendar"]')).toBeVisible()
  await page.locator('nav').getByRole('button',{name:'图标游戏',exact:true}).click();await page.getByRole('button',{name:'日常／周常'}).click();await expect(page.getByRole('button',{name:'刷新设置'}).locator('[data-icon="settings"]')).toBeVisible()
  await page.getByRole('button',{name:'刷新设置'}).click();await page.getByRole('dialog',{name:'刷新设置'}).getByRole('button',{name:'保存'}).click()
  await expect(page.locator('.routine-panel [data-icon="sun"]')).toBeVisible();await expect(page.locator('.routine-panel [data-icon="weekly"]')).toBeVisible()
 }finally{await app.close()}
})
