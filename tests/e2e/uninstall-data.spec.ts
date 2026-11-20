import {test,expect} from '@playwright/test'
import {spawn} from 'node:child_process'
import {existsSync,mkdtempSync,mkdirSync,readFileSync,writeFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {copyData,saveLocation} from '../../src/main/location'
import {Store} from '../../src/main/store'
import {createRequire} from 'node:module'

const requireElectron=createRequire(__filename)
test('卸载清理入口删除应用数据、历史目录与缓存，保留独立导出和其它文件',async()=>{
 const root=mkdtempSync(join(tmpdir(),'todo-uninstall-')),home=join(root,'program'),profile=join(root,'profile')
 const db=new Store(join(home,'data','app.sqlite'))
 try{
  for(const name of ['previous','current']){
   const target=join(root,name)
   await copyData(db,target);saveLocation(home,target)
   mkdirSync(join(target,'data','backups'));await db.backup(join(target,'data','backups','导入前-123-0123abcd.sqlite'))
  }
  await db.backup(join(root,'manual-export.sqlite'))
 }finally{db.close()}
 const unrelated=join(root,'current','data','other.txt');writeFileSync(unrelated,'keep')
 mkdirSync(profile);writeFileSync(join(profile,'cache'),'remove')
 const legacy=join(home,'我的待办数据');mkdirSync(legacy);writeFileSync(join(legacy,'state'),'remove')
 for(let i=0;i<2;i++){
  const result=await new Promise<number|null>((ok,fail)=>{
   const child=spawn(requireElectron('electron'),['.','--remove-app-data'],{windowsHide:true,env:{...process.env,TODO_TEST:'1',TODO_HOME:root,TODO_DATA_DIR:''},stdio:'inherit'})
   child.once('error',fail);child.once('exit',ok)
  })
  expect(result).toBe(0)
 }
 for(const path of [join(home,'data'),join(home,'location.json'),legacy,profile,join(root,'previous','data'),join(root,'current','data','app.sqlite')])expect(existsSync(path),path).toBe(false)
 expect(readFileSync(unrelated,'utf8')).toBe('keep')
 expect(existsSync(join(root,'manual-export.sqlite'))).toBe(true)
})
