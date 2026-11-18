import { DateTime } from 'luxon'
import type { Task,TaskInput,Status,Group } from './types'
export const localZone=()=>Intl.DateTimeFormat().resolvedOptions().timeZone
export const stateOf=(t:Pick<Task,'doneAt'|'end'>,now=Date.now()):Status=>t.doneAt!==null?'done':t.end<=now?'overdue':'pending'
export function addDays(time:number,days:number,zone:string){const value=DateTime.fromMillis(time,{zone}).plus({days});if(!value.isValid||!Number.isFinite(value.toMillis()))throw Error('周期超出可表示日期范围');return value.toMillis()}
export function localInput(time:number|null){return time===null?'':DateTime.fromMillis(time).toFormat("yyyy-MM-dd'T'HH:mm")}
export function parseInput(text:string){const d=DateTime.fromISO(text,{zone:localZone()});return d.isValid?d.toMillis():NaN}
export function formatTime(time:number|null){return time===null?'未设置':DateTime.fromMillis(time).toFormat('yyyy-MM-dd HH:mm')}
export function validateInput(raw:TaskInput,groups:Group[]):TaskInput {
 if(!raw||typeof raw.name!=='string'||!raw.name.trim())throw Error('请填写名称')
 if(!['study','game'].includes(raw.kind)||!groups.some(g=>g.id===raw.cat&&g.kind===raw.kind))throw Error('请选择有效的所属分类或游戏')
 if(!Number.isFinite(raw.end)||!DateTime.fromMillis(raw.end).isValid)throw Error('请填写有效的截止 / 结束时间')
 if(raw.kind==='game'&&(!Number.isFinite(raw.start)||!DateTime.fromMillis(raw.start!).isValid||raw.start!>=raw.end))throw Error('结束时间必须晚于开始时间')
 if(raw.remind!==null&&(!Number.isFinite(raw.remind)||!DateTime.fromMillis(raw.remind).isValid||raw.remind>raw.end))throw Error('提醒时间不能晚于截止 / 结束时间')
 if(!Number.isInteger(raw.period)||raw.period<0||(raw.kind==='study'&&raw.period!==0))throw Error('周期必须为正整数天或不重复')
 if(!DateTime.now().setZone(raw.zone).isValid)throw Error('时间区域无效')
 if(raw.period>0)addDays(raw.start!,raw.period,raw.zone)
 return {...raw,name:raw.name.trim(),desc:String(raw.desc??''),reward:String(raw.reward??''),start:raw.kind==='study'?null:raw.start}
}
export function periodicInput(raw:TaskInput):TaskInput {
 if(raw.kind!=='game'||!raw.period)return raw
 if(!Number.isInteger(raw.period)||raw.period<=0)throw Error('周期必须为正整数天')
 if(raw.start===null||!Number.isFinite(raw.start))throw Error('请填写开始时间')
 return {...raw,end:addDays(raw.start,raw.period,raw.zone)}
}
export function sortTasks(tasks:Task[],filter:Status|'all'='pending'){
 return tasks.sort((a,b)=>(filter==='done'?(b.doneAt??0)-(a.doneAt??0):filter==='overdue'?b.end-a.end:a.end-b.end)||a.createdAt-b.createdAt||a.id.localeCompare(b.id))
}
