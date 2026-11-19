import React from 'react'
import {DateTime} from 'luxon'
import type {CalendarEvent,GameVersion} from '../shared/types'
import type {CalendarAxis} from '../shared/game-calendar'
import {calendarSpan} from '../shared/game-calendar'
import {formatTime,stateOf} from '../shared/time'
export function CalendarEventRow({event,version,axis,now,onOpen}:{event:CalendarEvent;version:GameVersion;axis:CalendarAxis;now:number;onOpen:(event:CalendarEvent)=>void}){
 const t=event.task,span=calendarSpan(t,version,axis),status=stateOf(t,now),compact=axis.width*span.width/100<64
 const label=event.preview?'未来预览':status==='done'?'已完成':status==='overdue'?'已超期':t.start!>now?'未开始':'进行中'
 const title=`${t.name}\n${formatTime(t.start)} — ${formatTime(t.end)}\n${t.desc||'未填写描述'}\n${label}`
 const info=<><span className="calendar-bar-heading"><strong className="calendar-bar-title">{t.name}</strong></span><span className="calendar-bar-description">{t.desc||'暂无活动描述'}</span><span className="calendar-bar-dates"><time dateTime={new Date(t.start!).toISOString()} aria-label="活动开始日期">{DateTime.fromMillis(t.start!).toFormat('yyyy/MM/dd')}</time><time dateTime={new Date(t.end).toISOString()} aria-label="活动结束日期">{DateTime.fromMillis(t.end).toFormat('yyyy/MM/dd')}</time></span></>
 return <div className="calendar-event-row calendar-grid-row rich-event-row" data-event-id={t.id} data-preview={event.preview}>
  <button className="calendar-event-name" onClick={()=>onOpen(event)} title={title}>{t.name}<span>{label}</span></button>
  <div className={'calendar-event-track rich-event-track '+(compact?'compact-event':'')} style={{gridTemplateColumns:`minmax(0,${span.left}%) minmax(0,${span.width}%) minmax(0,1fr)`}}>
   {compact&&<div className="compact-event-marker" style={{gridColumn:2}} aria-hidden="true"/>}
   <button type="button" className={`calendar-event-bar rich-event-bar ${event.preview?'preview':''} ${status==='done'?'completed':''} ${compact?'compact-info':''}`} aria-label={(event.preview?'预览活动：':'查看活动：')+t.name+' '+formatTime(t.start)} title={title} data-clipped-start={span.clippedStart} data-clipped-end={span.clippedEnd} style={{gridColumn:compact?'1 / -1':2}} onClick={()=>onOpen(event)}>{info}</button>
  </div>
 </div>
}
