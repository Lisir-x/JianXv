import React from 'react'
import {DateTime} from 'luxon'
import type {CalendarAxis} from '../shared/game-calendar'
import {calendarPosition} from '../shared/game-calendar'
export function CalendarFrame({axis,now,viewport,children,labelWidth=180,onLocate,locateLabel}:{axis:CalendarAxis;now:number;viewport:React.RefObject<HTMLDivElement|null>;children:React.ReactNode;labelWidth?:number;onLocate?:()=>void;locateLabel?:string}){
 const inRange=now>=axis.start&&now<axis.end
 const weekday=['星期日','星期一','星期二','星期三','星期四','星期五','星期六'][DateTime.fromMillis(now).weekday%7]
 return <div className={'calendar-horizontal timeline-frame '+(labelWidth===0?'timeline-no-label':'')} ref={viewport} aria-label="活动日历内容框" tabIndex={0}><div className="calendar-sheet timeline-sheet" style={{'--timeline-width':axis.width+'px','--calendar-label-width':labelWidth+'px'} as React.CSSProperties}>
  {labelWidth>0&&<div className="calendar-name-head timeline-corner" aria-hidden="true">游戏</div>}
  <div className="calendar-date-header calendar-grid-row timeline-ruler"><div className="calendar-name-head">{labelWidth?'时间尺':''}</div><div className="calendar-date-track">{onLocate&&<button className="calendar-locate" type="button" aria-label={locateLabel} title={locateLabel} onClick={onLocate}>◎</button>}{axis.ticks.map(tick=><span className="calendar-date" key={tick.time} style={{left:calendarPosition(tick.time,axis)+'%'}}>{tick.label}</span>)}</div></div>
  {children}
  {inRange&&<div className="calendar-marker-layer" aria-hidden="true"><div className="calendar-today-line timeline-now-line" style={{left:calendarPosition(now,axis)+'%'}}><span className="calendar-today-label timeline-now-label">今天 {DateTime.fromMillis(now).toFormat('MM/dd')} {weekday}</span></div></div>}
 </div></div>
}
