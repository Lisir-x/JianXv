import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync,mkdirSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('阶段11 键盘、模态焦点、详情状态和窄窗口',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-usable-'))}})
 try{const page=await app.firstWindow();await page.getByRole('button',{name:'学习',exact:true}).click();await page.getByRole('button',{name:'＋ 新增事项'}).click();await expect(page.getByLabel('事项名称 *')).toBeFocused();await page.getByLabel('事项名称 *').fill('键盘事项');await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'放弃未保存的修改？'})).toBeVisible();await page.getByRole('dialog',{name:'放弃未保存的修改？'}).getByRole('button',{name:'取消',exact:true}).click();await page.getByLabel('所属分类 *').selectOption({label:'作业'});await page.getByLabel('事项名称 *').press('Control+Enter');await expect(page.getByRole('dialog')).toHaveCount(0)
 await page.getByRole('button',{name:'键盘事项',exact:true}).click();await page.getByRole('button',{name:'标记完成',exact:true}).click();await expect(page.getByRole('dialog',{name:'事项详情'}).getByRole('button',{name:'取消完成',exact:true})).toBeVisible();await page.getByRole('button',{name:'关闭',exact:true}).click()
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(720,620));await page.getByRole('button',{name:'＋ 新增事项'}).click();await expect(page.getByRole('dialog',{name:'新增事项'})).toBeVisible();await page.keyboard.press('Shift+Tab');expect(await page.evaluate(()=>!!document.activeElement?.closest('dialog'))).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);await page.getByRole('button',{name:'关闭',exact:true}).click();await page.getByRole('button',{name:'首页',exact:true}).click();mkdirSync('.test-data',{recursive:true});await page.screenshot({path:'.test-data/narrow-home.png'});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
 }finally{await app.close()}
})
