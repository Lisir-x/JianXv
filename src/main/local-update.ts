import {createHash,randomUUID} from 'node:crypto'
import {createReadStream,openSync,readSync,closeSync,statSync,mkdirSync,rmSync,realpathSync} from 'node:fs'
import {basename,dirname,extname,join,resolve} from 'node:path'
import {execFileSync,spawn} from 'node:child_process'
import {Store} from './store'

export interface LocalUpdatePreview {token:string;path:string;sha256:string;size:number}
export interface UpdateLocation {installed:boolean;programPath:string;registeredPaths:string[]}

export function updateLocation(programPath:string,registeredPaths:string[],packaged:boolean):UpdateLocation{
 const equal=(a:string,b:string)=>resolve(a).replace(/[\\/]+$/,'').toLowerCase()===resolve(b).replace(/[\\/]+$/,'').toLowerCase()
 return {programPath,registeredPaths,installed:packaged&&registeredPaths.some(p=>equal(p,programPath))}
}

export function registeredInstallLocations():string[]{
 if(process.platform!=='win32')return []
 const ps=join(process.env.SystemRoot||'C:\\Windows','System32','WindowsPowerShell','v1.0','powershell.exe')
 const script="[Console]::OutputEncoding=[Text.UTF8Encoding]::new(); @('HKCU','HKLM') | ForEach-Object { $p='Registry::HKEY_'+$(if($_ -eq 'HKCU'){'CURRENT_USER'}else{'LOCAL_MACHINE'})+'\\Software\\c79f6fae-2fb7-5884-b678-ded7b129709a'; (Get-ItemProperty -LiteralPath $p -Name InstallLocation -ErrorAction SilentlyContinue).InstallLocation }"
 try{return execFileSync(ps,['-NoLogo','-NoProfile','-NonInteractive','-Command',script],{encoding:'utf8',windowsHide:true,timeout:10000}).split(/\r?\n/).map(x=>x.trim()).filter(Boolean)}catch{return []}
}

async function inspect(path:string){
 if(extname(path).toLowerCase()!=='.exe')throw Error('请选择 Windows 安装程序（.exe）')
 const info=statSync(path);if(!info.isFile()||info.size<64)throw Error('安装包不是有效文件')
 const handle=openSync(path,'r'),header=Buffer.alloc(64)
 try{if(readSync(handle,header,0,64,0)!==64||header.toString('ascii',0,2)!=='MZ')throw Error('安装包不是有效的 Windows 程序');const pe=header.readUInt32LE(60),signature=Buffer.alloc(4);if(pe>info.size-4||readSync(handle,signature,0,4,pe)!==4||!signature.equals(Buffer.from([0x50,0x45,0,0])))throw Error('安装包不是有效的 Windows 程序')}finally{closeSync(handle)}
 const hash=createHash('sha256');for await(const chunk of createReadStream(path))hash.update(chunk as Buffer)
 return {size:info.size,sha256:hash.digest('hex')}
}

export async function startInstaller(path:string){
 await new Promise<void>((ok,fail)=>{const child=spawn(path,[],{detached:true,stdio:'ignore',windowsHide:false});child.once('error',fail);child.once('spawn',()=>{child.unref();ok()})})
}

export class LocalUpdate {
 private pending:LocalUpdatePreview|null=null
 constructor(private store:Store,private launch:(path:string)=>Promise<void>=startInstaller,private now:()=>number=()=>Date.now()){}
 cancel(){this.pending=null}
 async prepare(file:string){
  this.cancel();if(typeof file!=='string'||!file.trim())throw Error('请选择本地安装包')
  const path=resolve(file),checked=await inspect(path);if(realpathSync(path).toLowerCase()===realpathSync(process.execPath).toLowerCase())throw Error('请选择安装包，而不是当前正在运行的程序');this.pending={token:randomUUID(),path,...checked};return this.pending
 }
 reveal(token:string){if(!this.pending||token!==this.pending.token)throw Error('更新预览已失效，请重新选择');return this.pending.path}
 async start(token:string,location:UpdateLocation){
  if(!location.installed)throw Error('当前程序不是已登记的安装版本，请手动备份并运行安装包')
  const selected=this.pending;if(!selected||selected.token!==token)throw Error('更新预览已失效，请重新选择')
  const check=async()=>{const checked=await inspect(selected.path);if(checked.size!==selected.size||checked.sha256!==selected.sha256){this.cancel();throw Error('安装包已发生变化，请重新选择')}if(this.pending!==selected)throw Error('更新预览已失效，请重新选择')}
  await check()
  const folder=join(dirname(this.store.path),'backups');mkdirSync(folder,{recursive:true});const backup=join(folder,`更新前-${this.now()}-${randomUUID().slice(0,8)}.sqlite`)
  await this.store.backup(backup,this.now());try{Store.inspect(backup)}catch(e){rmSync(backup,{force:true});throw e}
  await check()
  await this.launch(selected.path);this.cancel();return {backup,name:basename(selected.path)}
 }
}
