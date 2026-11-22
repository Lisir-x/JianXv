import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('设置固定在侧栏底部，不随子模块增减或收放移动',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jianxu-settings-rail-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');const settings=page.locator('nav').getByRole('button',{name:'设置',exact:true}),exit=page.getByRole('button',{name:'退出应用'});const initial=await settings.boundingBox(),exitBox=await exit.boundingBox();expect(initial).not.toBeNull();expect(exitBox!.y).toBeGreaterThan(initial!.y)
  await page.evaluate(async()=>{for(let i=0;i<15;i++){await window.todo.call('addGroup',{kind:'study',name:`额外分类${i}`});await window.todo.call('addGroup',{kind:'game',name:`额外游戏${i}`})}});await expect(page.getByRole('scrollbar',{name:'滚动学习子模块'})).toBeVisible();await expect(page.getByRole('scrollbar',{name:'滚动游戏子模块'})).toBeVisible()
  const check=async()=>{const box=await settings.boundingBox();expect(box!.y).toBeCloseTo(initial!.y,0);expect((await exit.boundingBox())!.y).toBeCloseTo(exitBox!.y,0)};await check()
  await page.locator('#nav-study').hover();await page.mouse.wheel(0,500);await check();await page.getByRole('button',{name:'收起学习子模块'}).click();await check();await page.getByRole('button',{name:'收起游戏子模块'}).click();await check();await page.getByRole('button',{name:'展开学习子模块'}).click();await check()
  await settings.click();await expect(page.getByRole('heading',{name:'设置',exact:true})).toBeVisible()
 }finally{await app.close()}
})
