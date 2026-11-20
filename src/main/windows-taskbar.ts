import {shell} from 'electron'
import {existsSync,readdirSync} from 'node:fs'
import {basename,dirname,join,normalize} from 'node:path'

const legacyAppId='local.personal.todo'
const samePath=(left:string,right:string)=>normalize(left).toLowerCase()===normalize(right).toLowerCase()

type TaskbarIcon={appId:string;name:string;exe:string;icon:string;pinnedDir?:string;relaunchArgs:string[]}

export function refreshPinnedTaskbarIcons({appId,name,exe,icon,pinnedDir,relaunchArgs}:TaskbarIcon){
 if(!pinnedDir)return
 let entries:string[]
 try{entries=readdirSync(pinnedDir)}catch{return} // No local pinned shortcuts, or Explorer manages them elsewhere.
 for(const entry of entries){
  if(!entry.toLowerCase().endsWith('.lnk'))continue
  const path=join(pinnedDir,entry)
  try{
   const link=shell.readShortcutLink(path)
   const knownApp=link.appUserModelId===appId||link.appUserModelId===legacyAppId
   if(link.appUserModelId&&!knownApp)continue
   if(!samePath(link.target,exe)){
    if(relaunchArgs.length||!knownApp||existsSync(link.target))continue
    const oldHome=dirname(link.target),home=dirname(exe)
    const oldName=basename(link.target).toLowerCase()
    const oldFolder=basename(oldHome).toLowerCase()
    if(oldName!=='笺序.exe'&&oldName!=='我的待办.exe')continue
    const renamedFolder=['personal-todo','personaltodo'].includes(oldFolder)&&samePath(join(dirname(oldHome),name),home)
    if(!samePath(oldHome,home)&&!renamedFolder)continue
   }
   if(relaunchArgs.length&&!knownApp)continue // Other development apps may share electron.exe.
   const moving=!samePath(link.target,exe)
   if(!moving&&link.icon&&samePath(link.icon,icon)&&link.iconIndex===0&&link.appUserModelId===appId)continue
   shell.writeShortcutLink(path,'update',{target:exe,icon,iconIndex:0,appUserModelId:appId,...(moving?{cwd:dirname(exe)}:{})})
  }catch{/* A stale or inaccessible shortcut must not block the app from opening. */}
 }
}
