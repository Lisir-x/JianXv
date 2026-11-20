import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('子模块整行及三点悬停与主模块一致',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-child-hover-'))}});try{const page=await app.firstWindow();await page.waitForSelector('nav');const child=page.locator('nav').getByRole('button',{name:'作业',exact:true}),row=child.locator('..'),more=row.locator('.submodule-more');await child.hover();await expect(row).toHaveCSS('background-color','rgb(233, 221, 203)');await expect(child).toHaveCSS('background-color','rgba(0, 0, 0, 0)');await more.hover();await expect(more).toHaveCSS('background-color','rgb(218, 198, 173)');await child.click();await child.hover();await expect(row).toHaveCSS('background-color','rgb(234, 214, 185)')}finally{await app.close()}})
