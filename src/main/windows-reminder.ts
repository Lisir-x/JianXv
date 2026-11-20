import {execFile} from 'node:child_process'
import {existsSync} from 'node:fs'
import {join} from 'node:path'

const protocol='jianxu-reminder:'

export function usesShortcutFreeReminders(){
 return existsSync(join(process.resourcesPath,'no-start-menu-shortcut'))
}

export function reminderTaskFromArgs(args:string[]){
 const uri=args.find(arg=>arg.toLowerCase().startsWith(protocol))
 if(!uri)return
 try{
  const id=decodeURIComponent(uri.slice(protocol.length))
  if(id.length>0&&id.length<=256&&Array.from(id).every(char=>char.charCodeAt(0)>=32))return id
 }catch{/* Ignore invalid protocol arguments. */}
}

export function showWindowsReminder(appId:string,title:string,body:string,taskId:string,done:(error:Error|null)=>void){
 // Electron's Win32 notification presenter always creates a Start menu link.
 // Call the Windows toast API directly when the user opted out of that link.
 const powershell=join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe')
 const script=join(process.resourcesPath,'windows-reminder.ps1')
 const logo=join(process.resourcesPath,'jianxu-notification.png')
 const toast={appId,title,body,logo,uri:protocol+encodeURIComponent(taskId)}
 execFile(powershell,['-NoProfile','-NonInteractive','-ExecutionPolicy','Bypass','-File',script],{
  windowsHide:true,timeout:10000,env:{...process.env,JIANXU_TOAST:JSON.stringify(toast)},
 },error=>done(error))
}
