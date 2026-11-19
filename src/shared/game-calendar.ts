import {DateTime} from 'luxon'
import type {CalendarEvent,GameCalendarData,GameVersion,Group,State,Task} from './types'
import {currentActivity,currentIndex,estimate,occurrence,segmentFor} from './recurrence'
import {addDays} from './time'
export const overlapsVersion=(task:Task,version:GameVersion)=>task.start!==null&&task.start<version.end&&task.end>version.start
function recurringEvents(state:State,group:Group,now:number,limit:number):CalendarEvent[]{
 const version=group.version!,result:CalendarEvent[]=[]
 for(const series of state.series){
  const current=currentActivity(series,state,now),cursor=current?.index??currentIndex(series,now),sourceId=current?.id??null
  if(current&&current.cat===group.id&&overlapsVersion(current,version))result.push({task:current,preview:false,sourceId})
  const raw=occurrence(series,cursor,{...state,exceptions:[]}),active=segmentFor(series,cursor),shifted=current&&raw&&current.start!==raw.start&&active?.period
  for(const segment of series.segments){
   let seg=segment
   if(shifted&&segment===active){const start=current.end,period=segment.period;seg={...segment,from:cursor+1,base:{...segment.base,start,end:addDays(start,period,segment.zone),doneAt:null}}}
   if(!seg.period||seg.base.cat!==group.id)continue
   const duration=seg.base.end-seg.base.start!,first=Math.max(cursor+1,seg.from,estimate(seg,version.start-duration)-1),last=seg.until??Number.MAX_SAFE_INTEGER
   let added=0
   for(let index=first;index<last;index++){
    let task:Task|undefined
    if(seg!==segment){try{const start=addDays(seg.base.start!,(index-seg.from)*seg.period,seg.zone),end=addDays(start,seg.period,seg.zone),lead=segment.base.remind===null?null:segment.base.end-segment.base.remind;task={...segment.base,start,end,remind:lead===null?null:end-lead,id:series.id+':'+index,seriesId:series.id,index,doneAt:null}}catch{break}}
    else task=occurrence(series,index,state)
    if(!task){if(state.exceptions.some(ex=>ex.seriesId===series.id&&ex.index===index&&ex.deleted))continue;break}
    if(task.start!>=version.end)break
    if(task.cat===group.id&&overlapsVersion(task,version)){result.push({task,preview:true,sourceId});if(++added>=limit+1)break}
   }
  }
 }
 return result
}
export function gameCalendar(state:State,now:number,cat='',requestedLimit=500):GameCalendarData{
 const limit=Math.min(10000,Math.max(1,Math.floor(requestedLimit)||500))
 const allGames=state.groups.filter(g=>g.kind==='game')
 return {now,games:allGames.filter(g=>!cat||g.id===cat).map(group=>{
  const hue=(153+allGames.findIndex(g=>g.id===group.id)*137.508)%360
  if(!group.version)return {group,events:[],hasMore:false,hue}
  const events:CalendarEvent[]=[...state.items.filter(t=>t.kind==='game'&&t.cat===group.id&&overlapsVersion(t,group.version!)).map(task=>({task,preview:false,sourceId:task.id})),...recurringEvents(state,group,now,limit)]
  events.sort((a,b)=>a.task.start!-b.task.start!||a.task.end-b.task.end||a.task.createdAt-b.task.createdAt||a.task.id.localeCompare(b.task.id))
  return {group,events:events.slice(0,limit),hasMore:events.length>limit,hue}
 })}
}
export interface CalendarAxis {start:number;end:number;width:number;ticks:{time:number;label:string}[]}
export function calendarAxis(versions:GameVersion[],zone:string,pixelsPerDay=32,daily=false):CalendarAxis|null{
 if(!versions.length)return null
 const start=DateTime.fromMillis(Math.min(...versions.map(v=>v.start)),{zone}).startOf('day'),end=DateTime.fromMillis(Math.max(...versions.map(v=>v.end)),{zone}).startOf('day').plus({days:1}),days=end.diff(start,'days').days
 const step=daily&&days<=10000?1:days<=120?1:Math.ceil(days/120),width=Math.min(12000,Math.max(720,days*pixelsPerDay)),ticks=[]
 for(let offset=0;offset<days;offset+=step){const date=start.plus({days:offset});ticks.push({time:date.toMillis(),label:date.toFormat('MM/dd')})}
 const last=end.minus({days:1});if(ticks.at(-1)?.time!==last.toMillis())ticks.push({time:last.toMillis(),label:last.toFormat('MM/dd')})
 return {start:start.toMillis(),end:end.toMillis(),width,ticks}
}
export function calendarPosition(time:number,axis:Pick<CalendarAxis,'start'|'end'>){return Math.min(100,Math.max(0,(time-axis.start)/(axis.end-axis.start)*100))}
export function calendarSpan(task:Task,version:GameVersion,axis:CalendarAxis){const start=Math.max(task.start!,version.start),end=Math.min(task.end,version.end);const left=calendarPosition(start,axis);return {left,width:Math.max(0,calendarPosition(end,axis)-left),clippedStart:task.start!<version.start,clippedEnd:task.end>version.end}}
