import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('分类及游戏概况样式区分状态并保持准确跳转',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jianxu-breakdown-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data,zone=Intl.DateTimeFormat().resolvedOptions().timeZone,base={kind:'study',cat:s.groups[0].id,name:'待做',start:null,end:s.now+3600000,remind:null,desc:'',reward:'',period:0,zone};await window.todo.call('save',{input:base});await window.todo.call('save',{input:{...base,name:'超期',end:s.now-1000}});await window.todo.call('addGroup',{kind:'game',name:'测试游戏'})})
  await page.getByRole('button',{name:'学习',exact:true}).click();await expect(page.getByRole('heading',{name:'分类概况'})).toBeVisible()
  const name=page.locator('.overview-group-name').filter({hasText:'作业'});await expect(name.locator('svg')).toBeVisible();await expect(name.locator('.overview-group-arrow')).toBeVisible()
  const pending=page.getByRole('button',{name:'作业：待完成 1 项'}),overdue=page.getByRole('button',{name:'作业：已超期 1 项'});const styles=await Promise.all([pending,overdue].map(x=>x.evaluate(el=>({color:getComputedStyle(el).color,background:getComputedStyle(el).backgroundColor}))));expect(styles[0].color).not.toBe(styles[1].color);expect(styles[0].background).not.toBe(styles[1].background)
  await overdue.click();await expect(page.getByRole('heading',{name:'作业'})).toBeVisible();await expect(page.getByRole('button',{name:'已超期',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'超期',exact:true})).toBeVisible()
  await page.getByRole('button',{name:'游戏',exact:true}).click();await expect(page.getByRole('heading',{name:'游戏概况'})).toBeVisible();await page.locator('.overview-group-name').filter({hasText:'测试游戏'}).click();await expect(page.getByRole('heading',{name:'测试游戏'})).toBeVisible()
 }finally{await app.close()}
})
