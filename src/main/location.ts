import {join,resolve,relative,isAbsolute,dirname,sep} from 'node:path'
import {existsSync,readFileSync,mkdirSync,writeFileSync,renameSync,readdirSync,cpSync,rmSync,rmdirSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {Store} from './store'
export const legacyDataName='我的待办数据'

function configuredLocation(home:string,name:string){
 const config=join(home,name)
 if(!existsSync(config))return undefined
 const value=JSON.parse(readFileSync(config,'utf8'))
 if(typeof value.directory!=='string'||!value.directory.trim())throw Error('数据位置配置无效：'+config)
 return resolve(home,value.directory)
}
export function dataLocation(home:string){return configuredLocation(home,'location.json')??home}
export function isWithin(parent:string,child:string){
 const path=relative(parent,child)
 return path===''||(!isAbsolute(path)&&path!=='..'&&!path.startsWith('..'+sep))
}
export async function startupDataLocation(home:string){
 const current=dataLocation(home)
 if(current!==home||existsSync(join(home,'location.json'))||existsSync(join(home,'data','app.sqlite')))return current
 const configured=configuredLocation(home,'todo-location.json')
 const legacy=configured??join(home,legacyDataName)
 const database=join(legacy,'data','app.sqlite')
 if(configured&&!isWithin(home,legacy)){
  if(!existsSync(database))throw Error('找不到旧配置所指向的数据库：'+database)
  saveLocation(home,legacy);return legacy
 }
 if(existsSync(database))await migrateData(database,home)
 else if(configured)throw Error('找不到旧配置所指向的数据库：'+database)
 return home
}
// Publish only a validated data directory; the old database and backups stay intact.
export async function migrateData(database:string,targetRoot:string){
 const destination=join(targetRoot,'data')
 if(existsSync(destination))throw Error('目标已有数据目录，未覆盖：'+destination)
 const stage=join(targetRoot,'.migration-'+randomUUID())
 mkdirSync(stage,{recursive:true})
 try{
  const source=new Store(database,true)
  try{
   const snapshot=join(stage,'app.sqlite')
   await source.backup(snapshot)
   const backups=join(dirname(database),'backups')
   if(existsSync(backups))cpSync(backups,join(stage,'backups'),{recursive:true})
   Store.inspect(snapshot)
  }finally{source.close()}
  renameSync(stage,destination)
 }catch(e){rmSync(stage,{recursive:true,force:true});throw e}
}
export async function copyData(store:Store,targetRoot:string){
 const target=resolve(targetRoot),source=resolve(dirname(dirname(store.path)))
 if(isWithin(source,target))throw Error('请选择当前数据目录之外的空目录')
 if(existsSync(target)&&readdirSync(target).length)throw Error('目标目录必须为空，避免覆盖已有数据')
 const stage=target+'.migrating-'+randomUUID();mkdirSync(join(stage,'data'),{recursive:true})
 try{await store.backup(join(stage,'data','app.sqlite'));writeFileSync(join(stage,'data','.personal-todo'),'local.personal.todo');const backups=join(dirname(store.path),'backups');if(existsSync(backups))cpSync(backups,join(stage,'data','backups'),{recursive:true});Store.inspect(join(stage,'data','app.sqlite'));if(existsSync(target))rmdirSync(target);renameSync(stage,target);return target}catch(e){rmSync(stage,{recursive:true,force:true});throw e}
}
export function knownDataLocations(home:string){
 const config=join(home,'location.json')
 const previous=existsSync(config)?JSON.parse(readFileSync(config,'utf8')).previous:undefined
 if(previous!==undefined&&(!Array.isArray(previous)||previous.some(p=>typeof p!=='string'||!p.trim())))throw Error('数据位置记录无效')
 return [...new Set([home,dataLocation(home),configuredLocation(home,'todo-location.json'),...(previous??[]).map((p:string)=>resolve(home,p))].filter((p):p is string=>!!p))]
}
export function saveLocation(home:string,target:string,retained:string[]=[]){
 const config=join(home,'location.json'),temporary=config+'.'+randomUUID()+'.tmp';mkdirSync(home,{recursive:true})
 const directory=relative(home,resolve(target))||'.'
 const previous=[...new Set([...knownDataLocations(home),...retained])].filter(path=>path!==home&&path!==resolve(target)).map(path=>relative(home,path))
 try{writeFileSync(temporary,JSON.stringify({directory,previous},null,2));renameSync(temporary,config)}catch(e){rmSync(temporary,{force:true});throw e}
}
