import {test,expect,_electron as electron,type Locator} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('首页与父模块最近项均有纸笺质感、明显悬停反馈及可操作空状态',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-nearest-paper-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');const style=(el:Locator)=>el.evaluate(node=>{const c=getComputedStyle(node);return {image:c.backgroundImage,border:c.borderColor,shadow:c.boxShadow}})
  const inspect=async(card:Locator)=>{await page.locator('.brand').hover();const before=await style(card);expect(before.image).toContain('gradient');expect(before.shadow).not.toBe('none');await card.hover();await expect.poll(async()=> (await style(card)).border).not.toBe(before.border);const after=await style(card);expect(after.image).not.toBe(before.image);expect(after.border).not.toBe(before.border)}
  await inspect(page.getByRole('region',{name:'学习最近一项'}));await inspect(page.getByRole('region',{name:'游戏最近一项'}));await page.getByRole('button',{name:'学习',exact:true}).click();const empty=page.getByRole('region',{name:'学习最近一项'});await inspect(empty);await empty.getByRole('button',{name:'新增事项'}).click();await expect(page.getByRole('dialog',{name:'新增事项'})).toBeVisible();await page.getByRole('dialog',{name:'新增事项'}).getByRole('button',{name:'取消'}).click()
  await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:'纸笺事项',start:null,end:s.now+3600000,remind:null,desc:'',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone}})});const task=page.getByRole('region',{name:'学习最近一项'});await expect(task).toContainText('纸笺事项');await inspect(task);await task.getByRole('button',{name:'查看最近事项：纸笺事项'}).click();await expect(page.getByRole('dialog',{name:'事项详情'})).toBeVisible()
 }finally{await app.close()}
})
