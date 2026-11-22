import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('首页最近项和总览随窗口自适应，时间和交互完整',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-home-responsive-'))}})
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data,g=(await window.todo.call<any>('addGroup',{kind:'game',name:'响应游戏'})).data,z=Intl.DateTimeFormat().resolvedOptions().timeZone;await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:'响应事项',start:null,end:s.now+86400000,remind:null,desc:'',reward:'',period:0,zone:z}});await window.todo.call('save',{input:{kind:'game',cat:g.id,name:'响应活动',start:s.now,end:s.now+86400000,remind:null,desc:'',reward:'',period:0,zone:z}})})
  const study=page.getByRole('region',{name:'学习最近一项'}),game=page.getByRole('region',{name:'游戏最近一项'}),stats=page.getByRole('region',{name:'总览',exact:true});await expect(game).toContainText('响应活动')
  const check=async(width:number)=>{await app.evaluate(({BrowserWindow},w)=>BrowserWindow.getAllWindows()[0].setContentSize(w,820),width);await expect.poll(()=>page.evaluate(()=>window.innerWidth)).toBe(width);const boxes=await Promise.all([study,game,stats].map(x=>x.boundingBox()));expect(boxes.every(Boolean)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);for(const c of [study,game])expect(await c.locator('.card-time').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);return boxes.map(x=>x!.width)}
  const narrow=await check(720),normal=await check(1160),wide=await check(1500);expect(normal[0]).toBeGreaterThan(narrow[0]-200);expect(wide[0]).toBeGreaterThan(normal[0]+30);expect(wide[1]).toBeGreaterThan(normal[1]+30);expect(wide[2]).toBeGreaterThan(normal[2]+30);expect(Math.abs(wide[0]-wide[1])).toBeLessThan(2)
  await game.getByRole('button',{name:'查看最近事项：响应活动'}).click();await expect(page.getByRole('dialog',{name:'活动详情'})).toBeVisible()
 }finally{await app.close()}
})
