import React from 'react'
import {DateTime} from 'luxon'
import type {CalendarEvent,CalendarGame,Group} from '../shared/types'
import type {CalendarAxis} from '../shared/game-calendar'
import {calendarPosition} from '../shared/game-calendar'
import {CalendarEventRow} from './CalendarEventRow'
export function CalendarGameBlock({entry,axis,now,single,onOpen,onMore,limit}:{entry:CalendarGame;axis:CalendarAxis;now:number;single:boolean;onOpen:(event:CalendarEvent)=>void;onManage:(group:Group)=>void;onMore:()=>void;limit:number}){
 const {group,events,hasMore,hue}=entry,version=group.version!
 const blockAxis=single?axis:{...axis,start:version.start,end:version.end,width:axis.width*(calendarPosition(version.end,axis)-calendarPosition(version.start,axis))/100}
 const lanes=<div className={'calendar-lanes '+(!events.length?'calendar-lanes-empty':'')}>{events.map(event=><CalendarEventRow key={event.task.id} event={event} version={version} axis={blockAxis} now={now} onOpen={onOpen}/>)}</div>
 return <section className={'calendar-game '+(single?'calendar-single-block':'calendar-multi-block')} key={group.id} aria-label={group.name+'活动日历'} data-game-id={group.id} style={{'--game-color':`hsl(${hue} 34% 27%)`,'--game-soft':'color-mix(in srgb, var(--game-color) 9%, var(--paper-raised))','--game-edge':'color-mix(in srgb, var(--game-color) 38%, var(--paper-raised))',...(single?{}:{marginLeft:calendarPosition(version.start,axis)+'%',width:(calendarPosition(version.end,axis)-calendarPosition(version.start,axis))+'%'})} as React.CSSProperties}>
  {!single&&<header className="calendar-version-range"><time dateTime={new Date(version.start).toISOString()}>{DateTime.fromMillis(version.start).toFormat('MM/dd')}</time><strong>{group.name} · 版本 {version.number}</strong><time dateTime={new Date(version.end).toISOString()}>{DateTime.fromMillis(version.end).toFormat('MM/dd')}</time></header>}{lanes}
  {hasMore&&<div className="calendar-load"><button onClick={onMore} disabled={limit>=10000}>加载更多活动</button><span>已显示前 {events.length} 条</span></div>}
 </section>
}
