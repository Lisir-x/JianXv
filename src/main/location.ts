import {join,resolve,relative,isAbsolute,dirname} from 'node:path'
import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync,readdirSync,cpSync,rmSync,rmdirSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {Store} from './store'
export function dataLocation(home:string){
 const config=join(home,'todo-location.json')
 if(!existsSync(config))return join(home,'我的待办数据')
 const value=JSON.parse(readFileSync(config,'utf8'))
 if(typeof value.directory!=='string'||!value.directory.trim())throw Error('数据位置配置无效：'+config)
 return resolve(home,value.directory)
}
export async function copyData(store:Store,targetRoot:string){
 const target=resolve(targetRoot),source=resolve(dirname(dirname(store.path)))
 const inside=relative(source,target)
 if(inside===''||(!inside.startsWith('..')&&!isAbsolute(inside)))throw Error('请选择当前数据目录之外的空目录')
 if(existsSync(target)&&readdirSync(target).length)throw Error('目标目录必须为空，避免覆盖已有数据')
 const stage=target+'.migrating-'+randomUUID();mkdirSync(join(stage,'data'),{recursive:true})
 try{await store.backup(join(stage,'data','app.sqlite'));const backups=join(dirname(store.path),'backups');if(existsSync(backups))cpSync(backups,join(stage,'data','backups'),{recursive:true});Store.inspect(join(stage,'data','app.sqlite'));if(existsSync(target))rmdirSync(target);renameSync(stage,target);return target}catch(e){rmSync(stage,{recursive:true,force:true});throw e}
}
export function saveLocation(home:string,target:string){
 const config=join(home,'todo-location.json'),temporary=config+'.'+randomUUID()+'.tmp';mkdirSync(home,{recursive:true})
 // 保存相对路径，使整个程序文件夹搬盘后仍可直接启动。
 const directory=relative(home,target)||'.'
 try{writeFileSync(temporary,JSON.stringify({directory},null,2));renameSync(temporary,config)}catch(e){rmSync(temporary,{force:true});throw e}
}
