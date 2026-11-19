import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('首页总览纵向显示并随窗口变化',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-overview-'))}});try{const page=await app.firstWindow();await page.waitForSelector('nav');const stats=page.getByRole('region',{name:'总览'});await expect(stats.getByRole('heading',{name:'总览'})).toBeVisible();const rows=await stats.locator('.home-stats-grid>div').all();expect(rows).toHaveLength(4);const boxes=await Promise.all(rows.map(r=>r.boundingBox()));for(let i=1;i<boxes.length;i++)expect(boxes[i]!.y).toBeGreaterThan(boxes[i-1]!.y);await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(720,650));expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)}finally{await app.close()}})
