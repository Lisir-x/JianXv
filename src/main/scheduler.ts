import type {Notice,Task} from '../shared/types'
import type {Service} from './service'
import {occurrence} from '../shared/recurrence'
export class Scheduler {
 private cursor:number|null=null
 paused=false
 constructor(readonly service:Service,readonly submit:(notice:Notice)=>void,readonly changed:()=>void=()=>{}){}
 scan(mode:'live'|'missed'='live'){
  if(this.paused)return
  const before=this.service.store.read(),last=this.cursor??before.settings.lastScan??null,ending:Notice[]=[],dismissedBefore=new Set(before.settings.dismissedNoticeIds)
  if(mode==='live'&&last!==null&&before.settings.notification)for(const series of before.series){const t=occurrence(series,series.currentIndex??series.segments[0].from,before);if(t&&t.doneAt===null&&t.end<=this.service.now()&&t.remind!==null&&t.remind>last&&t.remind<=this.service.now()&&t.updatedAt<t.remind&&!dismissedBefore.has(`${t.id}@${t.remind}`)&&!before.notices.some(n=>n.id===`${t.id}@${t.remind}`))ending.push({id:`${t.id}@${t.remind}`,taskId:t.id,name:t.name,kind:t.kind,cat:t.cat,scheduledAt:t.remind,recordedAt:this.service.now(),missed:false,read:false,system:'not-requested'})}
  this.service.rollCycles()
  const now=this.service.now(),state=this.service.store.read(),prior=this.cursor??state.settings.lastScan??null,previous=prior!==null&&prior>now?null:prior
  const candidates:Task[]=this.service.list(state)
  const ids=new Set([...(state.settings.dismissedNoticeIds??[]),...state.notices.map(n=>n.id)]),newNotices:Notice[]=[]
  for(const t of candidates){if(t.doneAt!==null||t.remind===null||t.remind>now)continue;const id=`${t.id}@${t.remind}`;if(ids.has(id))continue;ids.add(id);const missed=mode==='missed'||(previous!==null&&t.remind<previous)||t.updatedAt>=t.remind;const notice:Notice={id,taskId:t.id,name:t.name,kind:t.kind,cat:t.cat,scheduledAt:t.remind,recordedAt:now,missed,read:false,system:'not-requested'};state.notices.push(notice);newNotices.push(notice)}
  state.settings.lastScan=now
  // 先持久化去重记录，再请求系统通知，重启不会重新自动投递。
  this.service.store.write(state);this.cursor=now
  // 轮换已持久化后再投递结束边界提醒；旧期及其应用内记录仍按要求删除。
  for(const notice of ending){try{this.submit(notice)}catch{/* 系统拒绝不阻止新期建立 */}}
  for(const notice of newNotices){if(!notice.missed&&state.settings.notification){try{this.submit(notice);notice.system='submitted'}catch{notice.system='failed'}}}
  if(newNotices.length){this.service.store.mutate(s=>{for(const n of newNotices){const row=s.notices.find(x=>x.id===n.id);if(row)row.system=n.system}});this.changed()}
  return newNotices
 }
 reset(){this.cursor=null}
}
