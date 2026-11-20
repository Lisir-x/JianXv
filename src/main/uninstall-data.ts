import {lstatSync,readFileSync,readdirSync,realpathSync,rmSync,rmdirSync} from 'node:fs'
import {join,relative,resolve} from 'node:path'
import {knownDataLocations,legacyDataName} from './location'
import {APP_ID,Store} from './store'

function directory(path:string){
 try{
  if(!lstatSync(path).isDirectory()||relative(resolve(path),realpathSync(path))!=='')throw Error('跳过非普通数据目录：'+path)
  return true
 }catch(e){if((e as NodeJS.ErrnoException).code==='ENOENT')return false;throw e}
}
function removeIfEmpty(path:string){if(!readdirSync(path).length)rmdirSync(path)}

export function removeManagedData(home:string,profile:string,legacyProfile?:string){
 const locations=knownDataLocations(home)
 const legacy=join(home,legacyDataName)
 const profiles=[legacy,profile,...legacyProfile?[legacyProfile]:[]].filter(directory)
 const dataDirectories:string[]=[]
 for(const root of locations){
  if(profiles.includes(root))continue
  const data=join(root,'data')
  if(!directory(data))continue
  if(root!==home){
   // Custom directories belong to the user. Verify ownership before removing any files.
   try{
    if(readFileSync(join(data,'.personal-todo'),'utf8')!==APP_ID)throw Error('数据目录标识不符：'+data)
   }catch(e){
    if((e as NodeJS.ErrnoException).code!=='ENOENT')throw e
    const database=join(data,'app.sqlite')
    try{const original=new Store(database,true);original.close()}catch(error){
     if(!readdirSync(data).some(name=>name.startsWith('app.sqlite')||name==='backups'))continue
     throw error
    }
   }
  }
  directory(join(data,'backups'))
  dataDirectories.push(data)
 }
 for(const data of dataDirectories){
  const backups=join(data,'backups')
  if(directory(backups)){
   for(const entry of readdirSync(backups,{withFileTypes:true}))if(entry.isFile()&&/^(导入前-\d+-[a-f\d]{8}|\.import-[a-f\d-]{36})\.sqlite(?:\.[a-f\d-]{36}\.tmp)?$/.test(entry.name))rmSync(join(backups,entry.name))
   removeIfEmpty(backups)
  }
  // Do not delete manually exported files or unrelated files placed in a custom directory.
  for(const entry of readdirSync(data,{withFileTypes:true}))if(entry.isFile()&&/^(\.personal-todo|app\.sqlite(?:-(?:wal|shm|journal)|\.(?:unreadable|restore)-\d+-[a-f\d]{8}(?:-(?:wal|shm))?|\.[a-f\d-]{36}\.tmp)?)$/.test(entry.name))rmSync(join(data,entry.name))
  removeIfEmpty(data)
 }
 for(const path of profiles)rmSync(path,{recursive:true,force:true})
 for(const name of ['location.json','todo-location.json'])rmSync(join(home,name),{force:true})
}
