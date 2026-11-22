import {describe,it,expect,vi} from 'vitest'
import {mkdtempSync,writeFileSync,readFileSync,readdirSync,copyFileSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {Store} from '../../src/main/store'
import {LocalUpdate,updateLocation} from '../../src/main/local-update'

function fixture(){const dir=mkdtempSync(join(tmpdir(),'jianxu-update-')),db=new Store(join(dir,'data','app.sqlite')),exe=join(dir,'update.exe'),bytes=Buffer.alloc(128);bytes.write('MZ');bytes.writeUInt32LE(64,60);bytes.set([0x50,0x45,0,0],64);writeFileSync(exe,bytes);return {dir,db,exe}}
describe('离线安装包更新',()=>{
 it('仅已登记的当前安装目录允许自动启动',()=>{
  expect(updateLocation('E:\\笺序',['e:\\笺序\\'],true).installed).toBe(true)
  expect(updateLocation('E:\\副本',['E:\\笺序'],true).installed).toBe(false)
  expect(updateLocation('E:\\笺序',['E:\\笺序'],false).installed).toBe(false)
 })
 it('只校验可执行文件格式，不接受无效文件和失效的预览',async()=>{
  const {dir,db,exe}=fixture(),launch=vi.fn().mockResolvedValue(undefined),updater=new LocalUpdate(db,launch)
  try{const invalid=join(dir,'invalid.exe');writeFileSync(invalid,'not an executable');await expect(updater.prepare(invalid)).rejects.toThrow('有效文件');await expect(updater.prepare(join(dir,'data.sqlite'))).rejects.toThrow('.exe')
   if(process.platform==='win32')await expect(updater.prepare(process.execPath)).rejects.toThrow('而不是当前正在运行的程序')
   const selected=await updater.prepare(exe);expect(selected.sha256).toMatch(/^[a-f0-9]{64}$/);updater.cancel();expect(()=>updater.reveal(selected.token)).toThrow('预览已失效');expect(launch).not.toHaveBeenCalled()
  }finally{db.close()}
 })
 it('文件发生变化或运行目录不符时不执行，也不生成备份',async()=>{
  const {dir,db,exe}=fixture(),launch=vi.fn().mockResolvedValue(undefined),updater=new LocalUpdate(db,launch),location={installed:true,programPath:dir,registeredPaths:[dir]}
  try{let selected=await updater.prepare(exe);await expect(updater.start(selected.token,{...location,installed:false})).rejects.toThrow('不是已登记');expect(launch).not.toHaveBeenCalled()
   selected=await updater.prepare(exe);const bytes=readFileSync(exe);bytes[90]=1;writeFileSync(exe,bytes);await expect(updater.start(selected.token,location)).rejects.toThrow('发生变化');expect(launch).not.toHaveBeenCalled();expect(db.read().groups).toHaveLength(3)
  }finally{db.close()}
 })
 it('启动前创建可恢复备份；启动失败保留原数据和备份',async()=>{
  const {dir,db,exe}=fixture(),location={installed:true,programPath:dir,registeredPaths:[dir]},launch=vi.fn(async():Promise<void>=>{throw Error('无法启动')});const updater=new LocalUpdate(db,launch)
  try{const selected=await updater.prepare(exe);await expect(updater.start(selected.token,location)).rejects.toThrow('无法启动');expect(db.read().groups).toHaveLength(3);const backup=join(dir,'data','backups',readdirSync(join(dir,'data','backups'))[0]);expect(Store.inspect(backup).state.groups).toHaveLength(3);expect(launch).toHaveBeenCalledWith(exe)
   launch.mockResolvedValueOnce(undefined);const result=await updater.start(selected.token,location);expect(Store.inspect(result.backup).state.groups).toHaveLength(3);expect(()=>updater.reveal(selected.token)).toThrow('预览已失效')
  }finally{db.close()}
 })
 it('备份失败时不启动，备份期间安装包变化或预览被取消也不启动',async()=>{
  const {dir,db,exe}=fixture(),location={installed:true,programPath:dir,registeredPaths:[dir]},launch=vi.fn().mockResolvedValue(undefined),updater=new LocalUpdate(db,launch),backup=db.backup.bind(db)
  try{
   let selected=await updater.prepare(exe);const spy=vi.spyOn(db,'backup').mockRejectedValueOnce(Error('空间不足'));await expect(updater.start(selected.token,location)).rejects.toThrow('空间不足');expect(launch).not.toHaveBeenCalled()
   selected=await updater.prepare(exe);spy.mockImplementationOnce(async(path,now)=>{await backup(path,now);const bytes=readFileSync(exe);bytes[90]=2;writeFileSync(exe,bytes)});await expect(updater.start(selected.token,location)).rejects.toThrow('发生变化');expect(launch).not.toHaveBeenCalled()
   selected=await updater.prepare(exe);spy.mockImplementationOnce(async(path,now)=>{await backup(path,now);updater.cancel()});await expect(updater.start(selected.token,location)).rejects.toThrow('预览已失效');expect(launch).not.toHaveBeenCalled();expect(db.read().groups).toHaveLength(3)
  }finally{db.close()}
 })
 it('可启动隔离的本机可执行文件，启动前已生成有效备份',async()=>{
  if(process.platform!=='win32')return
  const {dir,db}=fixture(),exe=join(dir,'local-node.exe');copyFileSync(process.execPath,exe)
  try{const updater=new LocalUpdate(db),selected=await updater.prepare(exe),result=await updater.start(selected.token,{installed:true,programPath:dir,registeredPaths:[dir]});expect(Store.inspect(result.backup).state.groups).toHaveLength(3)}finally{db.close()}
 })
})
