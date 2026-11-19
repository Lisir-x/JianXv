import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('模块筛选下不再显示数量与排序行',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-header-'))}});try{const page=await app.firstWindow();await page.waitForSelector('nav');for(const name of ['学习','作业','游戏']){await page.locator('nav').getByRole('button',{name,exact:true}).click();await expect(page.locator('.module-header .section-heading')).toHaveCount(0);await expect(page.getByRole('button',{name:'待完成',exact:true})).toBeVisible()}}finally{await app.close()}})
