import React,{useEffect,useState} from 'react'
import {DateTime} from 'luxon'
import type {CalendarAxis} from '../shared/game-calendar'
import {calendarPosition} from '../shared/game-calendar'
export function CalendarFrame({axis,now,viewport,children,labelWidth=180}:{axis:CalendarAxis;now:number;viewport:React.RefObject<HTMLDivElement|null>;children:React.ReactNode;labelWidth?:number}){
 const inRange=now>=axis.start&&now<axis.end
 const [trackWidth,setTrackWidth]=useState(0)
 useEffect(()=>{const el=viewport.current;if(!el)return;const observer=new ResizeObserver(()=>setTrackWidth(el.clientWidth));observer.observe(el);setTrackWidth(el.clientWidth);return ()=>observer.disconnect()},[viewport])
 const weekday=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][DateTime.fromMillis(now).weekday%7],position=calendarPosition(now,axis)+'%'
 return <div className={'calendar-horizontal timeline-frame '+(labelWidth===0?'timeline-no-label':'')} ref={viewport} aria-label="活动日历内容框" tabIndex={0}>
  <div className="calendar-ruler-shell"><div className="calendar-date-header calendar-grid-row timeline-ruler"><div className="calendar-name-head">{labelWidth?'时间尺':''}</div><div className="calendar-date-track">{axis.ticks.map((tick,index)=>{const major=index%7===0||index===axis.ticks.length-1;return <span className={'calendar-date '+(major?'major-tick':'minor-tick')} key={tick.time} style={{left:calendarPosition(tick.time,axis)+'%'}}><span className="tick-label">{!major&&(trackWidth-48)/axis.ticks.length<44?'':tick.label}</span></span>})}{inRange&&<><span className="ruler-today-line" aria-hidden="true" style={{left:position}}/><span className="calendar-today-label timeline-now-label" style={{left:position}}>今天 {DateTime.fromMillis(now).toFormat('MM/dd')} {weekday}</span></>}</div></div></div>
  <div className="calendar-content-scroll" tabIndex={0} aria-label="活动日历列表"><div className="calendar-sheet timeline-sheet" style={{'--timeline-width':axis.width+'px','--calendar-label-width':labelWidth+'px'} as React.CSSProperties}>{children}{inRange&&<div className="calendar-marker-layer" aria-hidden="true"><div className="calendar-today-line timeline-now-line" style={{left:position}}/></div>}</div></div>
 </div>
}
