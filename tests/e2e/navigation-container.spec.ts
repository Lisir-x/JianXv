import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('未选中主模块整行底色加深，选中保持底色，箭头悬停叠加圆形反馈',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-nav-hover-'))}})
 try{
  const page=await app.firstWindow()
  await page.waitForSelector('nav')
  const parent=page.locator('.nav-parent').first(),label=parent.getByRole('button',{name:'学习',exact:true})
  const background=()=>parent.evaluate(el=>getComputedStyle(el).backgroundColor)
  const arrow=()=>parent.locator('.nav-toggle').evaluate(el=>{const css=getComputedStyle(el);return {background:css.backgroundColor,border:css.borderTopWidth,radius:css.borderRadius,shadow:css.boxShadow}})
  const parentBox=await parent.boundingBox()
  for(const route of ['首页','学习','作业']){
   await page.locator('nav').getByRole('button',{name:route,exact:true}).click()
   await page.locator('.brand').hover()
   const resting=await background(),hoverColor=route==='学习'?resting:'rgb(233, 221, 203)'
   expect(await arrow()).toEqual({background:'rgba(0, 0, 0, 0)',border:'0px',radius:'50%',shadow:'none'})
   await label.hover()
   expect(await background()).toBe(hoverColor)
   expect(await label.evaluate(el=>getComputedStyle(el).backgroundColor)).toBe('rgba(0, 0, 0, 0)')
   expect((await arrow()).background).toBe('rgba(0, 0, 0, 0)')
   await parent.locator('.nav-toggle').hover()
   expect(await background()).toBe(hoverColor)
   expect(await arrow()).toEqual({background:'rgb(218, 198, 173)',border:'0px',radius:'50%',shadow:'none'})
   expect(await parent.boundingBox()).toEqual(parentBox)
   await page.mouse.move(parentBox!.x+parentBox!.width-2,parentBox!.y+parentBox!.height/2)
   expect(await background()).toBe(hoverColor)
   expect((await arrow()).background).toBe('rgba(0, 0, 0, 0)')
   await page.locator('.brand').hover()
   expect(await background()).toBe(resting)
   expect((await arrow()).background).toBe('rgba(0, 0, 0, 0)')
  }
  await parent.getByRole('button',{name:'收起学习子模块'}).click()
  await expect(page.locator('#nav-study')).toBeHidden()
  await expect(page.locator('h1')).toHaveText('作业')
  await parent.getByRole('button',{name:'展开学习子模块'}).click()
  await expect(page.locator('#nav-study')).toBeVisible()
  await label.click()
  await expect(page.locator('h1')).toHaveText('学习总览')
 }finally{await app.close()}
})
test('本轮1 圆形折叠按钮位于主模块同一容器且不改变页面',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-nav-container-'))}});try{const page=await app.firstWindow();await page.getByRole('button',{name:'学习',exact:true}).click();await expect(page.locator('nav').getByText('主模块',{exact:true})).toHaveCount(0);const parent=page.locator('.nav-parent').first(),toggle=parent.getByRole('button',{name:'收起学习子模块'}),box=await parent.boundingBox(),circle=await toggle.boundingBox();expect(circle!.x).toBeGreaterThanOrEqual(box!.x);expect(circle!.x+circle!.width).toBeLessThanOrEqual(box!.x+box!.width);expect(circle!.width).toBe(circle!.height);expect(await toggle.evaluate(el=>getComputedStyle(el).borderRadius)).toBe('50%');await toggle.click();await expect(page.locator('#nav-study')).toBeHidden();await expect(page.locator('h1')).toHaveText('学习总览');await parent.getByRole('button',{name:'展开学习子模块'}).click();await expect(page.locator('#nav-study')).toBeVisible();await expect(parent).toHaveClass(/selected/);await page.locator('nav').getByRole('button',{name:'作业',exact:true}).click();await expect(parent).toHaveClass(/context/)}finally{await app.close()}})
