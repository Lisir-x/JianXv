import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('日常和日历使用与旧版一致的选中样式，父子页面及切换均一致',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-view-style-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(()=>window.todo.call('addGroup',{kind:'game',name:'样式游戏'}));await page.getByRole('button',{name:'游戏',exact:true}).click()
  const routine=page.getByRole('button',{name:'日常／周常'}),calendar=page.getByRole('button',{name:'活动日历'}),style=async(button:typeof routine)=>button.evaluate(el=>{const s=getComputedStyle(el);return {background:s.backgroundImage,color:s.color,border:s.borderColor,shadow:s.boxShadow}})
  for(const child of [false,true]){if(child)await page.locator('nav').getByRole('button',{name:'样式游戏',exact:true}).click();await routine.click();await expect(routine).toHaveAttribute('aria-pressed','true');await expect(calendar).toHaveAttribute('aria-pressed','false');const a=await style(routine);expect(a.background).toContain('245, 229, 203');expect(a.color).not.toBe('rgb(255, 251, 242)');await calendar.click();await expect(calendar).toHaveAttribute('aria-pressed','true');expect(await style(calendar)).toEqual(a);await page.getByRole('button',{name:'待完成',exact:true}).click();await expect(calendar).toHaveAttribute('aria-pressed','false');await expect(routine).toHaveAttribute('aria-pressed','false')}
 }finally{await app.close()}
})
