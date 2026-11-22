import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('设置提供离线本地安装包预览，未登记目录不可自动安装',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jianxu-update-ui-')),exe=join(dir,'可信来源安装包.exe'),bad=join(dir,'bad.exe'),bytes=Buffer.alloc(128);bytes.write('MZ');bytes.writeUInt32LE(64,60);bytes.set([0x50,0x45,0,0],64);writeFileSync(exe,bytes);writeFileSync(bad,'invalid')
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}}
 const app=await electron.launch(options)
 try{const page=await app.firstWindow(),requests:string[]=[];page.on('request',r=>{if(/^https?:/.test(r.url()))requests.push(r.url())});await page.getByRole('button',{name:'设置',exact:true}).click();const section=page.getByRole('region',{name:'软件更新'});await expect(section).toContainText('当前版本 1.0.0');await expect(section).toContainText('无需联网')
  await app.evaluate(({dialog},path)=>{(dialog as any).showOpenDialog=async()=>({canceled:false,filePaths:[path]})},exe)
  await section.getByRole('button',{name:'选择本地安装包'}).click();const preview=page.getByRole('dialog',{name:'本地软件更新'});await expect(preview).toContainText(exe);await expect(preview).toContainText('SHA-256');await expect(preview).toContainText('不能证明');await expect(preview).toContainText('不在已登记的安装目录');await expect(preview.getByRole('button',{name:'备份并启动安装程序'})).toHaveCount(0)
  const prepared=await page.evaluate(path=>window.todo.call<any>('prepareLocalUpdate',{path}),exe);expect(prepared.ok).toBe(true);const denied=await page.evaluate(token=>window.todo.call('startLocalUpdate',{token}),prepared.data.token);expect(denied.ok).toBe(false);expect(denied.error).toContain('不是已登记');await preview.getByRole('button',{name:'取消'}).click();await expect(preview).toHaveCount(0)
  await app.evaluate(({dialog},path)=>{(dialog as any).showOpenDialog=async()=>({canceled:false,filePaths:[path]})},bad);await section.getByRole('button',{name:'选择本地安装包'}).click();await expect(section.getByRole('alert')).toContainText('有效文件');expect(requests).toEqual([])
 }finally{await app.close()}
})
