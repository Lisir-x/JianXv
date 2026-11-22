import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('首页最近项固定尺寸，总览仅宽度随窗口变化',async()=>{
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-home-responsive-'))}}
 const app=await electron.launch(options)
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data,g=(await window.todo.call<any>('addGroup',{kind:'game',name:'响应游戏'})).data,z=Intl.DateTimeFormat().resolvedOptions().timeZone;await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:'响应事项',start:null,end:s.now+86400000,remind:null,desc:'',reward:'',period:0,zone:z}});await window.todo.call('save',{input:{kind:'game',cat:g.id,name:'响应活动',start:s.now,end:s.now+86400000,remind:null,desc:'',reward:'',period:0,zone:z}})})
  const study=page.getByRole('region',{name:'学习最近一项'}),game=page.getByRole('region',{name:'游戏最近一项'}),stats=page.getByRole('region',{name:'总览',exact:true});await expect(game).toContainText('响应活动')
  const check=async(width:number)=>{await app.evaluate(({BrowserWindow},w)=>BrowserWindow.getAllWindows()[0].setContentSize(w,820),width);await expect.poll(()=>page.evaluate(()=>window.innerWidth)).toBe(width);const boxes=await Promise.all([study,game,stats].map(x=>x.boundingBox()));expect(boxes.every(Boolean)).toBe(true);expect(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth)).toBe(true);for(const c of [study,game]){expect(await c.locator('.card-time').evaluate(el=>el.scrollWidth<=el.clientWidth)).toBe(true);expect(await c.locator('.card-bottom').evaluate(el=>{const r=el.getBoundingClientRect(),parent=el.closest('.module-nearest')!.getBoundingClientRect();return r.bottom<=parent.bottom})).toBe(true)}return boxes.map(x=>({width:x!.width,height:x!.height}))}
  const narrow=await check(720),normal=await check(1160),wide=await check(1500);for(const i of [0,1]){for(const size of [narrow[i],normal[i],wide[i]]){expect(size.width).toBeCloseTo(250,0);expect(size.height).toBeCloseTo(296,0)}}expect(wide[2].width).toBeGreaterThan(normal[2].width+30);expect(wide[2].height).toBeCloseTo(normal[2].height,0);expect(narrow[2].height).toBeCloseTo(normal[2].height,0)
  await game.getByRole('button',{name:'查看最近事项：响应活动'}).click();await expect(page.getByRole('dialog',{name:'活动详情'})).toBeVisible()
 }finally{await app.close()}
})

test('首页两个空状态保持固定尺寸并保留添加入口',async()=>{
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'jx-home-empty-'))}},app=await electron.launch(options)
 try{const page=await app.firstWindow();await page.waitForSelector('nav');const cards=[page.getByRole('region',{name:'学习最近一项'}),page.getByRole('region',{name:'游戏最近一项'})];const size=async(w:number)=>{await app.evaluate(({BrowserWindow},width)=>BrowserWindow.getAllWindows()[0].setContentSize(width,820),w);await expect.poll(()=>page.evaluate(()=>window.innerWidth)).toBe(w);return Promise.all(cards.map(c=>c.boundingBox()))};const initial=await size(1160),wide=await size(1500),narrow=await size(720);for(let i=0;i<2;i++){for(const box of [initial[i],wide[i],narrow[i]]){expect(box!.width).toBeCloseTo(250,0);expect(box!.height).toBeCloseTo(296,0)}}await cards[0].getByRole('button',{name:'新增事项'}).click();await expect(page.getByRole('dialog',{name:'新增事项'})).toBeVisible()
 }finally{await app.close()}
})
