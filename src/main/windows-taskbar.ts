import {shell,type BrowserWindow} from 'electron'
import {existsSync,readdirSync} from 'node:fs'
import {basename,dirname,join,normalize} from 'node:path'

const samePath=(left:string,right:string)=>normalize(left).toLowerCase()===normalize(right).toLowerCase()

type TaskbarIcon={appId:string;name:string;exe:string;icon:string;pinnedDir?:string;relaunchArgs:string[]}

export function setWindowsTaskbarIcon(window:BrowserWindow,{appId,name,exe,icon,pinnedDir,relaunchArgs}:TaskbarIcon){
 window.setAppDetails({appId,appIconPath:icon,appIconIndex:0,relaunchCommand:[exe,...relaunchArgs].map(arg=>`"${arg}"`).join(' '),relaunchDisplayName:name})
 if(!pinnedDir)return
 let entries:string[]
 try{entries=readdirSync(pinnedDir)}catch{return} // No local pinned shortcuts, or Explorer manages them elsewhere.
 for(const entry of entries){
  if(!entry.toLowerCase().endsWith('.lnk'))continue
  const path=join(pinnedDir,entry)
  try{
   const link=shell.readShortcutLink(path)
   if(link.appUserModelId&&link.appUserModelId!==appId)continue
   if(!samePath(link.target,exe)){
    if(relaunchArgs.length||link.appUserModelId!==appId||existsSync(link.target))continue
    const oldHome=dirname(link.target),home=dirname(exe)
    const oldName=basename(link.target).toLowerCase()
    const oldFolder=basename(oldHome).toLowerCase()
    if(oldName!=='笺序.exe'&&oldName!=='我的待办.exe')continue
    const renamedFolder=['personal-todo','personaltodo'].includes(oldFolder)&&samePath(join(dirname(oldHome),name),home)
    if(!samePath(oldHome,home)&&!renamedFolder)continue
   }
   if(relaunchArgs.length&&link.appUserModelId!==appId)continue // Other development apps may share electron.exe.
   const moving=!samePath(link.target,exe)
   if(!moving&&link.icon&&samePath(link.icon,icon)&&link.iconIndex===0&&link.appUserModelId===appId)continue
   shell.writeShortcutLink(path,'update',{target:exe,icon,iconIndex:0,appUserModelId:appId,...(moving?{cwd:dirname(exe)}:{})})
  }catch{/* A stale or inaccessible shortcut must not block the app from opening. */}
 }
}
