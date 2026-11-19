import { randomUUID } from 'node:crypto'
import type { Kind,State,Task,TaskInput,Scope,Snapshot,GameVersion,Group } from '../shared/types'
import { localZone,stateOf,sortTasks,validateInput,periodicInput,addDays } from '../shared/time'
import { Store } from './store'
import { occurrence,segmentFor,currentIndex,currentActivity } from '../shared/recurrence'
import {validateGameVersion} from '../shared/game-version'
import {gameCalendar} from '../shared/game-calendar'
export class Service {
 constructor(readonly store:Store,public clock:()=>number=()=>Date.now()){}
 now(){return this.clock()}
 pinGroup(id:string,pinned:boolean){return this.store.mutate(s=>{if(typeof pinned!=='boolean')throw Error('置顶状态无效');const g=s.groups.find(g=>g.id===id);if(!g)throw Error('子模块不存在');g.pinnedAt=pinned?Math.max(this.now(),...s.groups.filter(x=>x.kind===g.kind).map(x=>(x.pinnedAt??0)+1)):null;g.updatedAt=this.now();return g})}
 calendar(cat='',limit=500){return gameCalendar(this.store.read(),this.now(),cat,limit)}
 addGroup(kind:Kind,name:string,version?:GameVersion){return this.store.mutate(s=>{name=name?.trim();if(!['study','game'].includes(kind)||!name)throw Error('请填写名称');if(s.groups.some(g=>g.kind===kind&&g.name===name))throw Error('同一模块已存在该名称');if(version&&kind!=='game')throw Error('学习分类不能包含游戏版本');const g:Group={id:randomUUID(),kind,name,createdAt:this.now(),updatedAt:this.now(),...(version?{version:validateGameVersion(version)}:{})};s.groups.push(g);return g})}
 updateGame(id:string,name:string,version:GameVersion){return this.store.mutate(s=>{const g=s.groups.find(g=>g.id===id&&g.kind==='game');if(!g)throw Error('游戏不存在');name=name?.trim();if(!name)throw Error('请填写名称');if(s.groups.some(x=>x.id!==id&&x.kind==='game'&&x.name===name))throw Error('同一模块已存在该名称');const checked=validateGameVersion(version);g.name=name;g.version=checked;g.updatedAt=this.now();return g})}
 renameGroup(id:string,name:string){return this.store.mutate(s=>{const g=s.groups.find(g=>g.id===id);if(!g)throw Error('子模块不存在');name=name?.trim();if(!name)throw Error('请填写名称');if(s.groups.some(x=>x.id!==id&&x.kind===g.kind&&x.name===name))throw Error('同一模块已存在该名称');g.name=name;g.updatedAt=this.now()})}
 groupCounts(id:string){const s=this.store.read();return {items:s.items.filter(t=>t.cat===id).length,series:s.series.filter(x=>x.segments.some(seg=>seg.base.cat===id)).length,instances:s.exceptions.filter(x=>!x.deleted&&this.task(x.id,s)?.cat===id).length}}
 deleteGroup(id:string){this.store.mutate(s=>{
  if(!s.groups.some(g=>g.id===id))throw Error('子模块不存在');s.items=s.items.filter(t=>t.cat!==id)
  for(const ex of [...s.exceptions]){const t=this.task(ex.id,s),series=s.series.find(x=>x.id===ex.seriesId),seg=series?segmentFor(series,ex.index):undefined;if(t&&t.cat!==id&&seg?.base.cat===id){s.items.push({...t,seriesId:undefined,index:undefined,period:0});s.exceptions=s.exceptions.filter(x=>x.id!==ex.id)}else if(t?.cat===id&&seg?.base.cat!==id){ex.deleted=true;ex.patch={}}}
  for(const series of s.series){series.segments=series.segments.filter(seg=>seg.base.cat!==id)}s.series=s.series.filter(x=>x.segments.length);s.exceptions=s.exceptions.filter(ex=>s.series.some(x=>x.id===ex.seriesId&&segmentFor(x,ex.index)))
  s.groups=s.groups.filter(g=>g.id!==id);this.pruneNotices(s)
 })}
 rollCycles(){const s=this.store.read();let changed=false
  for(const series of s.series){if(!series.currentOnly){for(const seg of series.segments){if(seg.period){const lead=seg.base.remind===null?null:seg.base.end-seg.base.remind;seg.base.end=addDays(seg.base.start!,seg.period,seg.zone);seg.base.remind=lead===null?null:seg.base.end-lead}}series.currentOnly=true;changed=true}
   const cursor=series.currentIndex??series.segments[0].from,rule=segmentFor(series,cursor),raw=occurrence(series,cursor,{...s,exceptions:[]}),actual=occurrence(series,cursor,s)
   let hold=false
   if(rule?.period&&raw&&actual&&actual.start!==raw.start){
    if(actual.end>this.now())hold=true
    else{const start=actual.end,end=addDays(start,rule.period,rule.zone),lead=rule.base.remind===null?null:rule.base.end-rule.base.remind;series.segments=series.segments.filter(seg=>seg.from<=cursor).map(seg=>({...seg,until:Math.min(seg.until??Infinity,cursor+1)}));series.segments.push({from:cursor+1,until:null,period:rule.period,zone:rule.zone,base:{...rule.base,start,end,remind:lead===null?null:end-lead,doneAt:null}});changed=true}
   }
   const index=hold?cursor:currentIndex(series,this.now());if(series.currentIndex!==index){series.currentIndex=index;changed=true}
   if(index>series.segments[0].from){const active=segmentFor(series,index);if(active){const base=occurrence(series,index,{...s,exceptions:[]})!;series.segments=series.segments.filter(seg=>seg.from>=index);if(!series.segments.some(seg=>seg.from===index))series.segments.unshift({...active,from:index,base:{...base,doneAt:null}});series.firstId=undefined;changed=true}}
   const before=s.exceptions.length;s.exceptions=s.exceptions.filter(ex=>ex.seriesId!==series.id||ex.index>=index);if(before!==s.exceptions.length)changed=true
  }
  if(changed){this.pruneNotices(s);this.store.write(s)}
 }
 list(s:State=this.store.read(),_limit=100):Task[]{return [...s.items,...s.series.map(series=>currentActivity(series,s,this.now())).filter((t):t is Task=>!!t)]}
 task(id:string,s:State=this.store.read()):Task|undefined{const item=s.items.find(t=>t.id===id);if(item)return item;return s.series.map(series=>currentActivity(series,s,this.now())).find(t=>t?.id===id)}
 save(input:TaskInput,id?:string,scope:Scope='one'){
  this.rollCycles();return this.store.mutate(s=>{const data=validateInput(periodicInput(input),s.groups),old=id?this.task(id,s):undefined;if(id&&!old)throw Error('事项已删除或已轮换');if(old&&old.kind!==data.kind)throw Error('不能跨主模块迁移');const task:Task={...data,id:old?.id??randomUUID(),createdAt:old?.createdAt??this.now(),updatedAt:this.now(),doneAt:old?.doneAt??null}
   if(old?.seriesId){const series=s.series.find(x=>x.id===old.seriesId)!;const index=old.index!;task.seriesId=series.id;task.index=index
    if(scope==='one'){if(data.period!==old.period)throw Error('修改周期需要选择本期及以后');this.setException(s,task.id,{...task})}
    else{const completedAfter=!data.period?s.exceptions.filter(ex=>ex.seriesId===series.id&&ex.index>index).map(ex=>this.task(ex.id,s)).filter((t):t is Task=>!!t&&t.doneAt!==null):[];series.segments=series.segments.filter(seg=>seg.from<index).map(seg=>({...seg,until:seg.until===null||seg.until>index?index:seg.until}));series.segments.push({from:index,until:data.period?null:index+1,period:data.period,base:{...task,doneAt:null},zone:data.zone});for(const ex of s.exceptions.filter(ex=>ex.seriesId===series.id&&ex.index>=index)){ex.patch={doneAt:ex.patch.doneAt??null,updatedAt:this.now()}}if(old.doneAt!==null)this.setException(s,task.id,{doneAt:old.doneAt});if(!data.period){for(const saved of completedAfter)s.items.push({...saved,seriesId:undefined,index:undefined,period:0});for(const ex of [...s.exceptions].filter(ex=>ex.seriesId===series.id&&ex.index>index)){s.exceptions=s.exceptions.filter(x=>x.id!==ex.id)}}}
    this.pruneNotices(s);return this.task(task.id,s)!
   }
   if(data.period){const seriesId=randomUUID(),base={...task,doneAt:null};s.series.push({id:seriesId,currentOnly:true,currentIndex:0,firstId:old?.id,createdAt:task.createdAt,segments:[{from:0,until:null,period:data.period,base,zone:data.zone}]});if(old)s.items=s.items.filter(x=>x.id!==old.id);const first=occurrence(s.series[s.series.length-1],0,s)!;if(task.doneAt!==null)this.setException(s,first.id,{doneAt:task.doneAt});return this.task(first.id,s)!}
   if(old)s.items[s.items.findIndex(t=>t.id===id)]=task;else s.items.push(task);return task})
 }
 setException(s:State,id:string,patch:Partial<Task>,deleted=false){const original=this.task(id,s);const index=original?.index??Number(id.slice(id.lastIndexOf(':')+1)),seriesId=original?.seriesId??id.slice(0,id.lastIndexOf(':'));id=seriesId+':'+index;const ex=s.exceptions.find(x=>x.id===id);if(ex){ex.patch={...ex.patch,...patch};ex.deleted=deleted}else s.exceptions.push({id,seriesId,index,patch,deleted})}
 complete(id:string,done:boolean){this.rollCycles();return this.store.mutate(s=>{const t=this.task(id,s);if(!t)throw Error('事项已删除');t.doneAt=done?(t.doneAt??this.now()):null;t.updatedAt=this.now();if(t.seriesId)this.setException(s,id,{doneAt:t.doneAt,updatedAt:t.updatedAt});return t})}
 delete(id:string,scope:Scope='one'){this.store.mutate(s=>{const t=this.task(id,s);if(!t)throw Error('事项已删除');if(t.seriesId){if(scope==='one')this.setException(s,id,{},true);else{const series=s.series.find(x=>x.id===t.seriesId)!;series.segments=series.segments.filter(seg=>seg.from<t.index!).map(seg=>({...seg,until:Math.min(seg.until??Infinity,t.index!)}));s.exceptions=s.exceptions.filter(x=>x.seriesId!==series.id||x.index<t.index!);if(!series.segments.length)s.series=s.series.filter(x=>x.id!==series.id)}}else s.items=s.items.filter(t=>t.id!==id);this.pruneNotices(s)})}
 pruneNotices(s:State){s.notices=s.notices.filter(n=>!!this.task(n.taskId,s))}
 snapshot(limit=100,query:{kind?:Kind;cat?:string;filter?:string}={}):Snapshot {this.rollCycles();const s=this.store.read(),tasks=this.list(s),pending=sortTasks(tasks.filter(t=>stateOf(t,this.now())==='pending')),matching=tasks.filter(t=>(!query.kind||t.kind===query.kind)&&(!query.cat||t.cat===query.cat)&&(!query.filter||query.filter==='all'||stateOf(t,this.now())===query.filter));const scopeTasks=tasks.filter(t=>(!query.kind||t.kind===query.kind)&&(!query.cat||t.cat===query.cat));const counts={pending:0,overdue:0,done:0,all:scopeTasks.length};for(const t of scopeTasks)counts[stateOf(t,this.now())]++;return {counts,groups:s.groups,tasks:sortTasks(matching,query.filter as any).slice(0,limit),next:pending[0]??null,recent:s.groups.map(g=>pending.find(t=>t.cat===g.id)).filter((t):t is Task=>!!t),overdue:sortTasks(tasks.filter(t=>stateOf(t,this.now())==='overdue'),'overdue').slice(0,limit),overdueTotal:tasks.filter(t=>stateOf(t,this.now())==='overdue').length,notices:s.notices,settings:s.settings,now:this.now(),path:this.store.path,hasMore:matching.length>limit,notificationSupported:false,startupActual:false}}
 readNotices(){this.store.mutate(s=>{s.notices.forEach(n=>n.read=true)})}
 groupName(id:string){return this.store.read().groups.find(g=>g.id===id)?.name??'已删除'}
 defaultInput(kind:Kind):TaskInput{return {kind,name:'',cat:'',start:kind==='game'?this.now():null,end:this.now()+3600000,remind:null,desc:'',reward:'',period:0,zone:localZone()}}
}
