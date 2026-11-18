import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('阶段10 真实文件导出、预览取消/覆盖、清空确认',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'todo-recovery-ui-')),backup=join(dir,'export.sqlite')
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(()=>window.todo.call('addGroup',{kind:'game',name:'备份游戏'}));await app.evaluate(({dialog},path)=>{dialog.showSaveDialog=async()=>({canceled:false,filePath:path});dialog.showOpenDialog=async()=>({canceled:false,filePaths:[path]})},backup)
 await page.getByRole('button',{name:'设置',exact:true}).click();await page.getByRole('button',{name:'导出备份',exact:true}).click();await expect(page.getByRole('status')).toContainText('备份已导出');expect(existsSync(backup)).toBe(true)
 await page.evaluate(()=>window.todo.call('addGroup',{kind:'game',name:'后来新增'}));await page.getByRole('button',{name:'导入备份',exact:true}).click();await expect(page.getByRole('dialog',{name:'确认覆盖恢复'})).toContainText('现有数据已自动备份');await page.getByRole('dialog',{name:'确认覆盖恢复'}).getByRole('button',{name:'取消',exact:true}).click();await expect(page.locator('nav').getByText('后来新增')).toBeVisible()
 await page.getByRole('button',{name:'导入备份',exact:true}).click();await page.getByRole('button',{name:'确认覆盖',exact:true}).click();await expect(page.locator('nav').getByText('后来新增')).toHaveCount(0);await expect(page.locator('nav').getByText('备份游戏')).toBeVisible()
 await page.getByRole('button',{name:'清空数据',exact:true}).click();await expect(page.getByRole('button',{name:'继续',exact:true})).toBeDisabled();await page.getByLabel('请输入“清空”').fill('清空');await page.getByRole('button',{name:'继续',exact:true}).click();await page.getByRole('button',{name:'确认清空',exact:true}).click();await expect(page.locator('nav').getByText('备份游戏')).toHaveCount(0);await expect(page.locator('nav').getByRole('button',{name:'作业',exact:true})).toBeVisible();expect(existsSync(backup)).toBe(true)
 }finally{await app.close()}
})
