import Database from 'better-sqlite3'
import { mkdirSync,existsSync,renameSync,rmSync } from 'node:fs'
import { dirname } from 'node:path'
import { randomUUID } from 'node:crypto'
import type { State } from '../shared/types'
import { validateInput } from '../shared/time'
import { occurrence } from '../shared/recurrence'
import {validateGameVersion} from '../shared/game-version'
import {validateRoutineSettings} from '../shared/routine'
export const APP_ID='local.personal.todo'
export const SCHEMA=1
export function initialState(now=Date.now()):State {
  return {groups:['作业','实验','考试'].map(name=>({id:randomUUID(),kind:'study',name,createdAt:now,updatedAt:now})),items:[],series:[],exceptions:[],notices:[],settings:{notification:true,startup:false,trayExplained:false,lastBackup:null}}
}
export function validateState(s:State){
  if(!s||!['groups','items','series','exceptions','notices'].every(k=>Array.isArray((s as any)[k]))||typeof s.settings?.notification!=='boolean'||typeof s.settings?.startup!=='boolean')throw Error('数据结构不完整')
  const ids=new Set<string>(),names=new Set<string>()
  for(const g of s.groups){if(typeof g.id!=='string'||!g.id||!['study','game'].includes(g.kind)||typeof g.name!=='string'||!g.name.trim()||!Number.isFinite(g.createdAt)||!Number.isFinite(g.updatedAt)||ids.has(g.id)||names.has(g.kind+':'+g.name.trim()))throw Error('分类数据无效或重复');ids.add(g.id);names.add(g.kind+':'+g.name.trim())}
  for(const g of s.groups)if(g.version!==undefined){if(g.kind!=='game')throw Error('学习分类不能包含游戏版本');validateGameVersion(g.version)}
  for(const g of s.groups)if(g.pinnedAt!==undefined&&g.pinnedAt!==null&&(!Number.isFinite(g.pinnedAt)||g.pinnedAt<0))throw Error('子模块置顶状态无效')
  const routineIds=new Set<string>()
  for(const g of s.groups){
    if(g.routineSettings!==undefined){if(g.kind!=='game')throw Error('学习分类不能包含打卡设置');validateRoutineSettings(g.routineSettings)}
    if(g.routineTasks!==undefined){if(g.kind!=='game'||!g.routineSettings||!Array.isArray(g.routineTasks))throw Error('打卡清单数据无效');for(const task of g.routineTasks){if(!task||typeof task.id!=='string'||!task.id||routineIds.has(task.id)||typeof task.name!=='string'||!task.name.trim()||!['daily','weekly'].includes(task.kind)||!Number.isFinite(task.createdAt)||(task.donePeriod!==null&&!Number.isFinite(task.donePeriod)))throw Error('打卡任务数据无效');routineIds.add(task.id)}}
  }
  const validateTask=(t:any)=>{if(!t||typeof t.id!=='string'||typeof t.name!=='string'||typeof t.desc!=='string'||typeof t.reward!=='string'||(t.activityVersion!==undefined&&(typeof t.activityVersion!=='string'||!t.activityVersion.trim()))||!Number.isFinite(t.createdAt)||!Number.isFinite(t.updatedAt)||(t.doneAt!==null&&!Number.isFinite(t.doneAt)))throw Error('事项字段或归属关系无效');validateInput(t,s.groups)}
  const taskIds=new Set<string>();for(const t of s.items){validateTask(t);if(taskIds.has(t.id))throw Error('事项标识重复');taskIds.add(t.id)}
  const seriesIds=new Set<string>();for(const series of s.series){if(!series.id||seriesIds.has(series.id)||!series.segments.length)throw Error('周期系列无效');seriesIds.add(series.id);let end=0;for(const seg of series.segments){validateTask(seg.base);if(!Number.isInteger(seg.from)||seg.from<end||!Number.isInteger(seg.period)||seg.period<0||(seg.until!==null&&(!Number.isInteger(seg.until)||seg.until<=seg.from)))throw Error('周期规则范围无效');end=seg.until??Infinity}}
  const exceptionIds=new Set<string>();for(const ex of s.exceptions){if(exceptionIds.has(ex.id)||ex.id!==`${ex.seriesId}:${ex.index}`||!seriesIds.has(ex.seriesId)||!Number.isInteger(ex.index)||ex.index<0||typeof ex.deleted!=='boolean')throw Error('周期例外关系无效');exceptionIds.add(ex.id);if(ex.patch.cat&&!s.groups.some(g=>g.id===ex.patch.cat&&g.kind==='game'))throw Error('周期例外归属无效')}
  for(const ex of s.exceptions){const series=s.series.find(x=>x.id===ex.seriesId)!;if(!series.segments.some(seg=>ex.index>=seg.from&&(seg.until===null||ex.index<seg.until)))throw Error('周期例外超出生效范围');if(!ex.deleted){const t=occurrence(series,ex.index,s)!;validateTask(t);if(t.id!==(ex.index===0&&series.firstId?series.firstId:ex.id)||t.seriesId!==series.id||t.index!==ex.index||t.kind!=='game')throw Error('周期例外标识无效')}}
  const dismissed=s.settings.dismissedNoticeIds;if(dismissed!==undefined&&(!Array.isArray(dismissed)||dismissed.some(id=>typeof id!=='string'||!/^.+@-?\d+$/.test(id))||new Set(dismissed).size!==dismissed.length))throw Error('已删除提醒索引无效')
  const noticeIds=new Set<string>();for(const n of s.notices){if(!n.id||noticeIds.has(n.id)||!Number.isFinite(n.scheduledAt)||!Number.isFinite(n.recordedAt)||typeof n.read!=='boolean'||typeof n.missed!=='boolean'||!['not-requested','submitted','failed'].includes(n.system))throw Error('提醒记录无效');noticeIds.add(n.id);const split=n.taskId.lastIndexOf(':'),series=s.series.find(x=>x.firstId===n.taskId||x.id===n.taskId.slice(0,split)),task=s.items.find(x=>x.id===n.taskId)||(series?occurrence(series,series.firstId===n.taskId?0:Number(n.taskId.slice(split+1)),s):undefined);if(!task||n.id!==`${n.taskId}@${n.scheduledAt}`)throw Error('提醒记录关联无效')}
  if(typeof s.settings.trayExplained!=='boolean'||(s.settings.lastBackup!==null&&!Number.isFinite(s.settings.lastBackup))||(s.settings.lastScan!==undefined&&s.settings.lastScan!==null&&!Number.isFinite(s.settings.lastScan)))throw Error('设置数据无效')
}
export class Store {
  db:Database.Database
  constructor(readonly path:string,readonlyMode=false){
    if(!readonlyMode)mkdirSync(dirname(path),{recursive:true})
    const existed=existsSync(path)
    this.db=new Database(path,{readonly:readonlyMode,fileMustExist:readonlyMode})
    try{
      if(existed){const meta=this.db.prepare('SELECT * FROM metadata WHERE id=1').get() as any;if(meta?.app!==APP_ID||meta.version!==SCHEMA)throw Error('不支持的数据文件或版本');if(this.db.pragma('quick_check',{simple:true})!=='ok')throw Error('数据库完整性检查失败');validateState(this.read())}
      else{this.db.exec(`CREATE TABLE metadata(id INTEGER PRIMARY KEY CHECK(id=1),app TEXT NOT NULL,version INTEGER NOT NULL,backupAt INTEGER); CREATE TABLE documents(kind TEXT NOT NULL,id TEXT NOT NULL,payload TEXT NOT NULL,PRIMARY KEY(kind,id));CREATE INDEX documents_kind ON documents(kind);`);this.db.prepare('INSERT INTO metadata VALUES(1,?,?,NULL)').run(APP_ID,SCHEMA);this.write(initialState())}
      if(!readonlyMode){this.db.pragma('journal_mode = WAL');this.db.pragma('synchronous = FULL')}
    }catch(e){this.db.close();throw Error(`无法打开本地数据 ${path}：${e instanceof Error?e.message:String(e)}`,{cause:e})}
  }
  read():State {
    const rows=this.db.prepare('SELECT kind,id,payload FROM documents').all() as {kind:string;id:string;payload:string}[]
    const state={groups:[],items:[],series:[],exceptions:[],notices:[],settings:null} as unknown as State
    for(const row of rows){const value=JSON.parse(row.payload);if(row.kind==='settings')state.settings=value;else if(['groups','items','series','exceptions','notices'].includes(row.kind))(state as any)[row.kind].push(value);else throw Error('未知数据类别')}
    return state
  }
  write(state:State){validateState(state);this.db.transaction(()=>{const old=new Map((this.db.prepare('SELECT kind,id,payload FROM documents').all() as {kind:string;id:string;payload:string}[]).map(r=>[r.kind+'\0'+r.id,r]));const put=this.db.prepare('INSERT INTO documents VALUES(?,?,?) ON CONFLICT(kind,id) DO UPDATE SET payload=excluded.payload');const save=(kind:string,id:string,value:unknown)=>{const key=kind+'\0'+id,payload=JSON.stringify(value);if(old.get(key)?.payload!==payload)put.run(kind,id,payload);old.delete(key)};for(const kind of ['groups','items','series','exceptions','notices'] as const)for(const value of state[kind])save(kind,value.id,value);save('settings','settings',state.settings);const remove=this.db.prepare('DELETE FROM documents WHERE kind=? AND id=?');for(const row of old.values())remove.run(row.kind,row.id)})()}
  mutate<T>(fn:(state:State)=>T):T {const state=this.read();const result=fn(state);this.write(state);return result}
  close(){this.db.close()}
  async backup(target:string,now=Date.now()){
    const temporary=target+'.'+randomUUID()+'.tmp';mkdirSync(dirname(target),{recursive:true})
    try{await this.db.backup(temporary);const copy=new Database(temporary);try{copy.pragma('journal_mode = DELETE');copy.prepare('UPDATE metadata SET backupAt=? WHERE id=1').run(now);if(copy.pragma('quick_check',{simple:true})!=='ok')throw Error('备份完整性检查失败')}finally{copy.close()}renameSync(temporary,target)}catch(e){rmSync(temporary,{force:true});throw e}
  }
  static inspect(path:string){const db=new Database(path,{readonly:true,fileMustExist:true});try{if(db.pragma('quick_check',{simple:true})!=='ok')throw Error('备份文件损坏');const m=db.prepare('SELECT * FROM metadata WHERE id=1').get() as any;if(m?.app!==APP_ID)throw Error('不是本应用的备份');if(m.version!==SCHEMA)throw Error('不支持的备份版本');if(!Number.isFinite(m.backupAt))throw Error('文件不是有效导出的备份');const fake=Object.create(Store.prototype) as Store;fake.db=db;const state=fake.read();validateState(state);return {state,backupAt:m.backupAt as number}}finally{db.close()}}
}
