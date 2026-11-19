import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('阶段8 首页最近、超期展开与完成切换',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-home-ui-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;const base={kind:'study',cat:s.groups[0].id,name:'先做',start:null,end:Date.now()+600000,remind:null,desc:'',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone};await window.todo.call('save',{input:base});await window.todo.call('save',{input:{...base,name:'后做',end:Date.now()+1200000}});await window.todo.call('save',{input:{...base,name:'超期任务',end:Date.now()-60000}})});await expect(page.locator('.hero')).toContainText('先做');await expect(page.locator('.home-stats')).toContainText('待完成');await expect(page.locator('.home-group-grid .summary-row')).toHaveCount(3);expect(await page.locator('.overdue-toggle').evaluate(el=>el.compareDocumentPosition(document.querySelector('.home-group-grid')!) & Node.DOCUMENT_POSITION_PRECEDING)).not.toBe(0);await page.getByRole('button',{name:'1 项已超期',exact:false}).click();await expect(page.locator('.task-name')).toHaveText('超期任务');await page.locator('.hero').getByRole('button',{name:'标记完成'}).click();await expect(page.locator('.hero')).toContainText('后做');await page.locator('.hero').getByRole('button',{name:'后做',exact:true}).click();await expect(page.getByRole('dialog',{name:'事项详情'})).toBeVisible()
 }finally{await app.close()}
})
