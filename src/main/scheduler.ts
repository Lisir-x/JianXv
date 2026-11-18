import type {Notice,Task} from '../shared/types'
import type {Service} from './service'
import {estimate,occurrence} from '../shared/recurrence'
export class Scheduler {
 private cursor:number|null=null
 paused=false
 constructor(readonly service:Service,readonly submit:(notice:Notice)=>void,readonly changed:()=>void=()=>{}){}
 scan(mode:'live'|'missed'='live'){
  if(this.paused)return
  const now=this.service.now(),state=this.service.store.read(),prior=this.cursor??state.settings.lastScan??null,previous=prior!==null&&prior>now?null:prior
  const candidates:Task[]=[...state.items]
  for(const series of state.series)for(const seg of series.segments){
   if(seg.base.remind===null)continue
   const offset=seg.base.remind-seg.base.start!
   const first=previous===null||series.createdAt>=previous?seg.from:Math.max(seg.from,estimate(seg,previous-offset)-1)
   const last=Math.min(seg.period?estimate(seg,now-offset)+1:seg.from,seg.until===null?Number.MAX_SAFE_INTEGER:seg.until-1)
   for(let i=first;i<=last;i++){const t=occurrence(series,i,state);if(t)candidates.push(t)}
  }
  for(const ex of state.exceptions){const t=this.service.task(ex.id,state);if(t)candidates.push(t)}
  const ids=new Set(state.notices.map(n=>n.id)),newNotices:Notice[]=[]
  for(const t of candidates){if(t.doneAt!==null||t.remind===null||t.remind>now)continue;const id=`${t.id}@${t.remind}`;if(ids.has(id))continue;ids.add(id);const missed=mode==='missed'||(previous!==null&&t.remind<previous)||t.updatedAt>=t.remind;const notice:Notice={id,taskId:t.id,name:t.name,kind:t.kind,cat:t.cat,scheduledAt:t.remind,recordedAt:now,missed,read:false,system:'not-requested'};state.notices.push(notice);newNotices.push(notice)}
  state.settings.lastScan=now
  // 先持久化去重记录，再请求系统通知，重启不会重新自动投递。
  this.service.store.write(state);this.cursor=now
  for(const notice of newNotices){if(!notice.missed&&state.settings.notification){try{this.submit(notice);notice.system='submitted'}catch{notice.system='failed'}}}
  if(newNotices.length){this.service.store.mutate(s=>{for(const n of newNotices){const row=s.notices.find(x=>x.id===n.id);if(row)row.system=n.system}});this.changed()}
  return newNotices
 }
 reset(){this.cursor=null}
}
