import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('侧栏宽度可调整并保存，仅首页标题栏固定',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'todo-home-fixed-'))
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
 try{
  const page=await app.firstWindow()
  await page.waitForSelector('nav')
  await page.evaluate(async()=>{for(let i=0;i<12;i++)await window.todo.call('addGroup',{kind:'study',name:i===0?'一二三四五六七八':'分类'+i})})
  await page.reload()
  const name=page.locator('nav').getByRole('button',{name:'一二三四五六七八',exact:true})
  await expect(name).toBeVisible()
  expect(await name.locator('span').first().evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true)
  const handle=page.getByRole('separator',{name:'调整导航栏宽度'})
  await expect(handle).toHaveAttribute('aria-valuenow','250')
  const box=(await handle.boundingBox())!
  await page.mouse.move(box.x+box.width/2,box.y+100)
  await page.mouse.down();await page.mouse.move(310,box.y+100);await page.mouse.up()
  await expect(handle).toHaveAttribute('aria-valuenow','310')
  await page.reload()
  await expect(handle).toHaveAttribute('aria-valuenow','310')
  await handle.focus();await page.keyboard.press('ArrowLeft')
  await expect(handle).toHaveAttribute('aria-valuenow','300')
  const fixed=await page.locator('.home-fixed').boundingBox()
  const overview=await page.locator('.home-overview').boundingBox()
  await page.locator('.home-scroll').hover();await page.mouse.wheel(0,700)
  await expect.poll(()=>page.locator('.home-scroll').evaluate(el=>el.scrollTop)).toBeGreaterThan(100)
  expect(await page.locator('.home-fixed').boundingBox()).toEqual(fixed)
  expect((await page.locator('.home-overview').boundingBox())!.y).toBeLessThan(overview!.y-100)
  expect(await page.evaluate(()=>window.scrollY)).toBe(0)
  await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].setSize(720,600))
  await expect.poll(()=>page.locator('.home-scroll').evaluate(el=>el.clientHeight)).toBeGreaterThan(100)
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true)
 }finally{await app.close()}
})
