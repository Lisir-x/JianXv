import {test,expect,_electron as electron,type Locator} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

async function slideBounds(toast:Locator){
 return toast.evaluate(el=>{
  const motion=el.getAnimations().find(a=>a instanceof CSSTransition&&a.transitionProperty==='translate')
  if(!motion?.effect)return null
  const duration=Number(motion.effect.getComputedTiming().duration)
  motion.pause()
  motion.currentTime=0
  const from=el.getBoundingClientRect().toJSON()
  motion.currentTime=duration/2
  const midway=el.getBoundingClientRect().toJSON()
  motion.currentTime=duration
  const to=el.getBoundingClientRect().toJSON()
  motion.finish()
  return {from,midway,to,duration}
 })
}

test('纸笺提示缓缓滑入右侧内容区并向上离场，保留撤销和手动关闭',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-toast-'))}})
 try{
  const page=await app.firstWindow()
  await page.waitForSelector('nav')
  await page.evaluate(async()=>{
   const {groups}=(await window.todo.call('snapshot')).data as {groups:{id:string}[]}
   await window.todo.call('save',{input:{kind:'study',cat:groups[0].id,name:'提示测试',start:null,end:Date.now()+3600000,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'}})
  })
  await page.locator('nav').getByRole('button',{name:'学习',exact:true}).click()
  const main=page.locator('main'),before=await main.boundingBox(),toast=page.getByRole('status')
  await page.getByRole('button',{name:'完成最近事项',exact:true}).click()
  await page.getByRole('dialog',{name:'确认完成'}).getByRole('button',{name:'确认',exact:true}).click()
  const arrival=await slideBounds(toast)
  expect(arrival?.duration).toBeGreaterThanOrEqual(550)
  expect(arrival?.from.bottom).toBeLessThanOrEqual(0)
  expect(arrival?.to.top).toBeGreaterThan(0)
  expect(arrival?.midway.bottom).toBeGreaterThan(0)
  expect(arrival?.midway.top).toBeLessThan(arrival?.to.top)
  expect(await main.boundingBox()).toEqual(before)
  const workspace=page.locator('.workspace')
  const centered=()=>toast.evaluate((el)=>{
   const paper=el.getBoundingClientRect(), pane=el.closest('.workspace')!.getBoundingClientRect()
   return {offset:(paper.left+paper.right-pane.left-pane.right)/2,leftGap:paper.left-pane.left,rightGap:pane.right-paper.right}
  })
  expect(Math.abs((await centered()).offset)).toBeLessThan(1)
  const grip=(await page.locator('.sidebar-resize').boundingBox())!
  const gripX=grip.x+grip.width/2, gripY=grip.y+grip.height/2
  const previousWidth=(await workspace.boundingBox())!.width
  await page.mouse.move(gripX,gripY)
  await page.mouse.down()
  await page.mouse.move(gripX+150,gripY,{steps:4})
  await page.mouse.up()
  expect((await workspace.boundingBox())!.width).toBeLessThan(previousWidth)
  const resized=await centered()
  expect(Math.abs(resized.offset)).toBeLessThan(1)
  expect(resized.leftGap).toBeGreaterThanOrEqual(17)
  expect(resized.rightGap).toBeGreaterThanOrEqual(17)
  await expect(toast).toContainText('已完成')
  await expect(toast.getByRole('button',{name:'撤销'})).toBeEnabled()
  await expect(toast).toHaveCount(0,{timeout:7000})
  await page.getByRole('button',{name:'已完成',exact:true}).click()
  await page.getByRole('button',{name:'取消完成 提示测试',exact:true}).click()
  await page.getByRole('dialog',{name:'确认取消完成'}).getByRole('button',{name:'确认',exact:true}).click()
  await expect(toast).toContainText('已取消完成')
  const close=toast.getByRole('button',{name:'关闭提示'})
  await close.click()
  const departure=await slideBounds(toast)
  expect(departure?.duration).toBeGreaterThanOrEqual(550)
  expect(departure?.from.top).toBeGreaterThan(0)
  expect(departure?.to.bottom).toBeLessThanOrEqual(0)
  expect(departure?.midway.bottom).toBeGreaterThan(0)
  expect(departure?.midway.top).toBeLessThan(departure?.from.top)
  await expect(toast).toHaveCount(0)
 }finally{await app.close()}
})

test('减少动态效果时提示立即显示并可关闭',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-toast-reduced-'))}})
 try{
  const page=await app.firstWindow()
  await page.emulateMedia({reducedMotion:'reduce'})
  await page.locator('nav').getByRole('button',{name:'设置',exact:true}).click()
  await page.getByRole('switch',{name:'系统通知'}).click()
  const toast=page.getByRole('status').filter({hasText:'通知设置已保存'})
  await expect(toast).toBeVisible()
  await expect(toast).toHaveCSS('transition-property','none')
  await toast.getByRole('button',{name:'关闭提示'}).click()
  await expect(toast).toHaveCount(0)
 }finally{await app.close()}
})
