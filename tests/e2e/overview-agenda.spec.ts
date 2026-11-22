import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('接下来按时间列出可打开的纸笺条目，适配窄窗口',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jianxu-agenda-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;for(let i=0;i<3;i++)await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:`事项 ${i}`,start:null,end:s.now+(i+1)*3600000,remind:null,desc:'详情内容',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone}})})
  await page.getByRole('button',{name:'学习',exact:true}).click();await expect(page.getByRole('heading',{name:'接下来',exact:true})).toBeVisible();await expect(page.locator('.overview-upcoming')).not.toContainText('按结束时间')
  const rows=page.locator('.agenda-row');await expect(rows).toHaveCount(2);await expect(rows.first()).toContainText('事项 1');await expect(rows.first()).toContainText('作业');await expect(rows.first().locator('time')).toContainText('结束')
  const style=await rows.first().evaluate(el=>({radius:getComputedStyle(el).borderRadius,background:getComputedStyle(el).backgroundImage}));expect(parseFloat(style.radius)).toBeGreaterThan(0);expect(style.background).toContain('gradient')
  await rows.first().click();await expect(page.getByRole('dialog',{name:'事项详情'})).toContainText('详情内容');await page.getByRole('dialog',{name:'事项详情'}).getByRole('button',{name:'关闭'}).click()
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(720,600));await expect.poll(()=>page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
  const geometry=await rows.first().evaluate(el=>{const row=el.getBoundingClientRect(),time=el.querySelector('time')!.getBoundingClientRect();return time.right<=row.right&&time.left>=row.left});expect(geometry).toBe(true)
 }finally{await app.close()}
})
