import {DateTime} from 'luxon'
import type {Series,State,Task,Segment} from './types'
import {addDays} from './time'
export function segmentFor(series:Series,index:number){return series.segments.find(seg=>index>=seg.from&&(seg.until===null||index<seg.until))}
export function estimate(seg:Segment,time:number){if(!seg.period)return seg.from;const days=DateTime.fromMillis(time,{zone:seg.zone}).diff(DateTime.fromMillis(seg.base.start!,{zone:seg.zone}),'days').days;return Math.max(seg.from,seg.from+Math.floor(days/seg.period))}
export function occurrence(series:Series,index:number,state:State):Task|undefined {
 const canonical=`${series.id}:${index}`,id=index===0&&series.firstId?series.firstId:canonical,ex=state.exceptions.find(x=>x.id===canonical)
 if(ex?.deleted)return
 const seg=segmentFor(series,index);if(!seg)return
 let start:number
 try{start=addDays(seg.base.start!,(index-seg.from)*seg.period,seg.zone)}catch{return}
 const end=start+(seg.base.end-seg.base.start!),remind=seg.base.remind===null?null:end-(seg.base.end-seg.base.remind)
 return {...seg.base,start,end,remind,id,seriesId:series.id,index,period:seg.period,...ex?.patch}
}
export function generateWindow(series:Series,state:State,now:number,limit:number){
 const ids=new Set<number>();for(const seg of series.segments){const at=Math.min(estimate(seg,now-(seg.base.end-seg.base.start!)),seg.until===null?Infinity:seg.until-1),first=Math.max(seg.from,at-limit),last=seg.period?Math.min(at+limit,seg.until===null?Infinity:seg.until-1):seg.from;for(let i=first;i<=last;i++)ids.add(i)}
 state.exceptions.filter(ex=>ex.seriesId===series.id).forEach(ex=>ids.add(ex.index))
 return [...ids].map(i=>occurrence(series,i,state)).filter((t):t is Task=>!!t)
}
export function nextInSeries(series:Series,state:State,now:number):Task|undefined {
 const candidates:Task[]=[]
 for(const seg of series.segments){let index=estimate(seg,now-(seg.base.end-seg.base.start!));const stop=seg.until??Number.MAX_SAFE_INTEGER;while(index<stop){const t=occurrence(series,index,state);if(t&&t.doneAt===null&&t.end>now){candidates.push(t);break}if(!seg.period)break;index++;if(index-estimate(seg,now)>state.exceptions.length+3)break}}
 for(const ex of state.exceptions.filter(x=>x.seriesId===series.id)){const t=occurrence(series,ex.index,state);if(t&&t.doneAt===null&&t.end>now)candidates.push(t)}
 return candidates.sort((a,b)=>a.end-b.end||a.id.localeCompare(b.id))[0]
}
export function overdueInSeries(series:Series,state:State,now:number){
 let total=0
 for(const seg of series.segments){if(seg.base.end>now)continue;let last=Math.min(estimate(seg,now-(seg.base.end-seg.base.start!)),seg.until===null?Number.MAX_SAFE_INTEGER:seg.until-1);if(!seg.period)last=seg.from;while(last>=seg.from&&addDays(seg.base.start!,(last-seg.from)*seg.period,seg.zone)+(seg.base.end-seg.base.start!)>now)last--;total+=Math.max(0,last-seg.from+1)}
 for(const ex of state.exceptions.filter(x=>x.seriesId===series.id)){const original=occurrence(series,ex.index,{...state,exceptions:[]}),current=occurrence(series,ex.index,state);if(original)total+=(current&&current.end<=now&&current.doneAt===null?1:0)-(original.end<=now?1:0)}
 return total
}
