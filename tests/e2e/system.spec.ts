import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('阶段9 真实通知调用、隐藏托盘运行、去重与自启登记',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'todo-system-')),now=Date.now()
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir,TODO_NOW:String(now)}})
 let originalStartup=false
 try{const page=await app.firstWindow();await page.waitForSelector('nav');originalStartup=(await page.evaluate(()=>window.todo.call<any>('snapshot'))).data.startupActual
 await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;await window.todo.call('save',{input:{kind:'study',cat:s.groups[0].id,name:'桌面提醒测试',start:null,end:s.now+3600000,remind:s.now+60000,desc:'隔离测试',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone}})})
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close())
 expect((await page.evaluate(()=>window.todo.call<any>('health'))).data.visible).toBe(false)
 await page.evaluate(()=>window.todo.call('testAdvance',{ms:60000}))
 let state=(await page.evaluate(()=>window.todo.call<any>('snapshot'))).data
 expect(state.notices).toHaveLength(1);expect(state.notices[0].missed).toBe(false);expect(['submitted','failed']).toContain(state.notices[0].system)
 await expect.poll(async()=>{const h=(await page.evaluate(()=>window.todo.call<any>('health'))).data;return h.notificationShows+h.notificationFailures},{timeout:10000}).toBeGreaterThan(0)
 console.log('Windows实际通知事件', (await page.evaluate(()=>window.todo.call<any>('health'))).data)
 await page.evaluate(()=>window.todo.call('testAdvance',{ms:1000}));state=(await page.evaluate(()=>window.todo.call<any>('snapshot'))).data;expect(state.notices).toHaveLength(1)
 expect((await page.evaluate(()=>window.todo.call('setSettings',{startup:true}))).ok).toBe(true);expect((await page.evaluate(()=>window.todo.call<any>('snapshot'))).data.startupActual).toBe(true)
 expect((await page.evaluate(()=>window.todo.call('setSettings',{startup:false}))).ok).toBe(true);expect((await page.evaluate(()=>window.todo.call<any>('snapshot'))).data.startupActual).toBe(false)
 await page.evaluate(()=>window.todo.call('openWindow'));expect((await page.evaluate(()=>window.todo.call<any>('health'))).data.visible).toBe(true)
 }finally{try{const page=await app.firstWindow();await page.evaluate(value=>window.todo.call('setSettings',{startup:value}),originalStartup)}finally{await app.close()}}
})
