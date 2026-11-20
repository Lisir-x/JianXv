import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync,existsSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve} from 'node:path'
import {spawn} from 'node:child_process'
const exe=resolve(process.env.TODO_PACKAGED_EXE||'release/win-unpacked/笺序.exe')
test('阶段12 打包版本离线、单实例、持久化与真实通知',async()=>{
 test.skip(!existsSync(exe),'先生成本机打包版本')
 const dir=mkdtempSync(join(tmpdir(),'todo-packaged-')),now=Date.now(),env={...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir,TODO_NOW:String(now)}
 let app=await electron.launch({executablePath:exe,args:[],env})
 try{let page=await app.firstWindow();await expect(page.getByRole('heading',{name:'接下来，做什么？'})).toBeVisible();const requests:string[]=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});await page.route(/^https?:/,route=>route.abort());const sandbox=await page.evaluate(()=>({require:typeof (window as any).require,process:typeof (window as any).process}));expect(sandbox).toEqual({require:'undefined',process:'undefined'})
 const created=await page.evaluate(async()=>{const s=(await window.todo.call<any>('snapshot')).data;return window.todo.call<any>('save',{input:{kind:'study',cat:s.groups[0].id,name:'打包验收事项',start:null,end:s.now+3600000,remind:s.now+60000,desc:'离线持久化检查',reward:'',period:0,zone:Intl.DateTimeFormat().resolvedOptions().timeZone}})});expect(created.ok).toBe(true)
 const second=spawn(exe,[],{env,windowsHide:true,stdio:'ignore'});const code=await new Promise<number|null>((ok,no)=>{second.once('exit',ok);second.once('error',no)});expect(code).toBe(0);await expect.poll(async()=>(await page.evaluate(()=>window.todo.call<any>('health'))).data.visible).toBe(true)
 await app.evaluate(({BrowserWindow})=>BrowserWindow.getAllWindows()[0].close());await page.evaluate(()=>window.todo.call('testAdvance',{ms:60000}));await expect.poll(async()=>(await page.evaluate(()=>window.todo.call<any>('health'))).data.notificationShows).toBe(1);await page.evaluate(id=>window.todo.call('complete',{id,done:true}),created.data.id);await app.close()
 app=await electron.launch({executablePath:exe,args:['--background'],env:{...env,TODO_NOW:String(now+120000)}});page=await app.firstWindow();await page.waitForSelector('nav');const restored=(await page.evaluate(()=>window.todo.call<any>('snapshot',{filter:'all'}))).data;expect(restored.tasks.find((t:any)=>t.name==='打包验收事项').doneAt).toBe(now+60000);expect(restored.notices).toHaveLength(1);expect((await page.evaluate(()=>window.todo.call<any>('health'))).data.visible).toBe(false);expect(requests).toEqual([])
 const backup=join(dir,'packaged.sqlite');expect((await page.evaluate(path=>window.todo.call('export',{path}),backup)).ok).toBe(true);expect(existsSync(backup)).toBe(true)
 }finally{await app.close()}
})
test('阶段12 异常终止后已提交数据可恢复',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'todo-crash-')),env={...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir};let app=await electron.launch({args:['.'],env})
 try{let page=await app.firstWindow();await page.waitForSelector('nav');await page.evaluate(()=>window.todo.call('addGroup',{kind:'game',name:'崩溃前已提交'}));const exited=app.waitForEvent('close');await app.evaluate(()=>{process.exit(99)}).catch(()=>{});await exited;app=await electron.launch({args:['.'],env});page=await app.firstWindow();await expect(page.locator('nav').getByRole('button',{name:'崩溃前已提交',exact:true})).toBeVisible()}finally{await app.close()}
})
