import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {groupMenu} from './group-menu-helper'
test('阶段4 父模块创建、重名校验、草稿保护和删除确认',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-ui-'))}})
 try{const page=await app.firstWindow();await expect(page.getByRole('heading',{name:'接下来，做什么？'})).toBeVisible();await expect(page.locator('nav').getByText('添加')).toHaveCount(0)
 await page.locator('nav').getByRole('button',{name:'学习',exact:true}).click();await page.getByRole('button',{name:'＋ 添加分类'}).click();await page.getByLabel('名称',{exact:true}).fill('作业');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.getByRole('alert')).toContainText('已存在')
 await page.getByLabel('名称',{exact:true}).fill('课程设计');await page.getByRole('button',{name:'关闭',exact:true}).click();await expect(page.getByRole('dialog',{name:'放弃未保存的修改？'})).toBeVisible();await page.getByRole('button',{name:'取消',exact:true}).last().click();await expect(page.getByLabel('名称',{exact:true})).toHaveValue('课程设计');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.locator('nav').getByRole('button',{name:'课程设计',exact:true})).toBeVisible()
 await groupMenu(page,'课程设计','重命名');await page.getByLabel('名称',{exact:true}).fill('课程项目');await page.getByRole('button',{name:'保存',exact:true}).click();await expect(page.locator('nav').getByRole('button',{name:'课程项目',exact:true})).toBeVisible()
 await groupMenu(page,'课程项目','删除');await page.getByRole('dialog',{name:'删除分类',exact:true}).getByRole('button',{name:'取消',exact:true}).click();await expect(page.locator('nav').getByRole('button',{name:'课程项目',exact:true})).toBeVisible();await groupMenu(page,'课程项目','删除');await page.getByRole('button',{name:'连同内容一起删除'}).click();await expect(page.locator('nav').getByRole('button',{name:'课程项目',exact:true})).toHaveCount(0)
 }finally{await app.close()}
})
