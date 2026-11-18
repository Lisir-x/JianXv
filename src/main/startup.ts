import {existsSync,copyFileSync,renameSync,rmSync} from 'node:fs'
import {Store} from './store'
import {randomUUID} from 'node:crypto'
export function restoreDamagedDatabase(path:string,backup:string){
 Store.inspect(backup)
 const stamp=Date.now()+'-'+randomUUID().slice(0,8),stage=path+'.restore-'+stamp,original=path+'.unreadable-'+stamp,moved:{from:string;to:string}[]=[]
 try{
  copyFileSync(backup,stage);Store.inspect(stage)
  for(const suffix of ['','-wal','-shm'])if(existsSync(path+suffix)){renameSync(path+suffix,original+suffix);moved.push({from:path+suffix,to:original+suffix})}
  renameSync(stage,path)
  try{const check=new Store(path);check.close()}catch(e){rmSync(path,{force:true});for(const file of moved.reverse())renameSync(file.to,file.from);throw e}
  return original
 }catch(e){rmSync(stage,{force:true});for(const file of [...moved].reverse())if(existsSync(file.to)&&!existsSync(file.from))renameSync(file.to,file.from);throw e}
}
