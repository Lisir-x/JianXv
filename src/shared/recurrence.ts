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
// 每个系列只有当前一期；游标只前进，系统时钟回退不会复活旧期次。
export function currentIndex(series:Series,now:number){
 let index=series.currentIndex??series.segments[0].from
 for(const seg of series.segments){if(seg.base.start!>now&&seg.from>index)continue;let candidate=seg.period?estimate(seg,now):seg.from;candidate=Math.min(candidate,seg.until===null?candidate:seg.until-1);if(candidate<seg.from)continue;index=Math.max(index,candidate)}
 return index
}
export function currentActivity(series:Series,state:State,now:number){const cursor=series.currentIndex??series.segments[0].from,actual=occurrence(series,cursor,state),raw=occurrence(series,cursor,{...state,exceptions:[]});if(actual&&raw&&actual.start!==raw.start&&actual.end>now)return actual;return occurrence(series,currentIndex(series,now),state)}
