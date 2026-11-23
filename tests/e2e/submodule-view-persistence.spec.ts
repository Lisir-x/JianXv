import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('切换同一主模块子模块时保持当前入口',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-submodule-view-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{await window.todo.call('addGroup',{kind:'game',name:'游戏甲'});await window.todo.call('addGroup',{kind:'game',name:'游戏乙'});await window.todo.call('addGroup',{kind:'study',name:'分类乙'})})
  await page.getByRole('button',{name:'游戏',exact:true}).click();await page.locator('nav').getByRole('button',{name:'游戏甲',exact:true}).click();await page.getByRole('button',{name:'已超期',exact:true}).click();await expect(page.getByRole('button',{name:'已超期',exact:true})).toHaveAttribute('aria-pressed','true');await page.locator('nav').getByRole('button',{name:'游戏乙',exact:true}).click();await expect(page.getByRole('button',{name:'已超期',exact:true})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'待完成',exact:true})).toHaveAttribute('aria-pressed','false')
  await page.locator('nav').getByRole('button',{name:'游戏乙',exact:true}).click();await expect(page.getByRole('button',{name:'已超期',exact:true})).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'日常／周常'}).click();await page.locator('nav').getByRole('button',{name:'游戏甲',exact:true}).click();await expect(page.getByRole('button',{name:'日常／周常'})).toHaveAttribute('aria-pressed','true');await expect(page.getByRole('button',{name:'活动日历'})).toHaveAttribute('aria-pressed','false');await page.locator('nav').getByRole('button',{name:'游戏乙',exact:true}).click();await expect(page.getByRole('button',{name:'日常／周常'})).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'活动日历'}).click();await page.locator('nav').getByRole('button',{name:'游戏甲',exact:true}).click();await expect(page.getByRole('button',{name:'活动日历'})).toHaveAttribute('aria-pressed','true');await page.locator('nav').getByRole('button',{name:'游戏乙',exact:true}).click();await expect(page.getByRole('button',{name:'活动日历'})).toHaveAttribute('aria-pressed','true')
  await page.getByRole('button',{name:'学习',exact:true}).click();await page.locator('nav').getByRole('button',{name:'作业',exact:true}).click();await page.getByRole('button',{name:'已完成',exact:true}).click();await page.locator('nav').getByRole('button',{name:'实验',exact:true}).click();await expect(page.getByRole('button',{name:'已完成',exact:true})).toHaveAttribute('aria-pressed','true');await page.locator('nav').getByRole('button',{name:'分类乙',exact:true}).click();await expect(page.getByRole('button',{name:'已完成',exact:true})).toHaveAttribute('aria-pressed','true')
 }finally{await app.close()}
})
