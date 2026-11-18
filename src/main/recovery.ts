import {join,dirname} from 'node:path'
import {mkdirSync,copyFileSync,rmSync} from 'node:fs'
import {randomUUID} from 'node:crypto'
import {Store,initialState} from './store'
import type {State} from '../shared/types'
export interface ImportPreview {token:string;backupAt:number;groups:number;items:number;series:number;instances:number;protection:string}
export class Recovery {
 private pending:{token:string;path:string;state:State;protection:string}|null=null
 busy=false
 constructor(readonly store:Store,readonly now:()=>number=()=>Date.now()){}
 private folder(){const path=join(dirname(this.store.path),'backups');mkdirSync(path,{recursive:true});return path}
 async export(path:string){if(this.busy)throw Error('备份恢复正在进行');this.busy=true;try{await this.store.backup(path,this.now());this.store.mutate(s=>{s.settings.lastBackup=this.now()});return path}finally{this.busy=false}}
 async prepare(path:string):Promise<ImportPreview>{
  if(this.busy)throw Error('备份恢复正在进行');this.busy=true
  let staged=''
  try{this.cancel();const token=randomUUID();staged=join(this.folder(),`.import-${token}.sqlite`);copyFileSync(path,staged);const inspected=Store.inspect(staged);const protection=join(this.folder(),`导入前-${this.now()}-${token.slice(0,8)}.sqlite`);await this.store.backup(protection,this.now());this.pending={token,path:staged,state:inspected.state,protection};return {token,backupAt:inspected.backupAt,groups:inspected.state.groups.length,items:inspected.state.items.length,series:inspected.state.series.length,instances:inspected.state.exceptions.filter(x=>!x.deleted).length,protection}}
  catch(e){if(staged)rmSync(staged,{force:true});throw e}finally{this.busy=false}
 }
 commit(token:string){if(this.busy)throw Error('备份恢复正在进行');if(!this.pending||this.pending.token!==token)throw Error('导入预览已失效，请重新选择备份');const inspected=Store.inspect(this.pending.path);this.busy=true;try{this.store.write(inspected.state);this.cancel();return true}finally{this.busy=false}}
 cancel(){if(this.pending){rmSync(this.pending.path,{force:true});this.pending=null}}
 clear(word:string){if(word!=='清空')throw Error('请输入“清空”后确认');if(this.busy)throw Error('备份恢复正在进行');this.cancel();this.store.mutate(s=>{const fresh=initialState(this.now());s.groups=fresh.groups;s.items=[];s.series=[];s.exceptions=[];s.notices=[];s.settings.lastScan=this.now()})}
}
