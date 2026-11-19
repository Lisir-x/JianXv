import React from 'react'
import {DateTime} from 'luxon'
import type {CalendarEvent,CalendarGame,Group} from '../shared/types'
import type {CalendarAxis} from '../shared/game-calendar'
import {calendarPosition} from '../shared/game-calendar'
import {CalendarEventRow} from './CalendarEventRow'
export function CalendarGameBlock({entry,axis,now,single,onOpen,onManage,onMore,limit}:{entry:CalendarGame;axis:CalendarAxis;now:number;single:boolean;onOpen:(event:CalendarEvent)=>void;onManage:(group:Group)=>void;onMore:()=>void;limit:number}){
 const {group,events,hasMore,hue}=entry,version=group.version!
 const dates=<><time className="calendar-version-start" aria-label="版本开始日期" dateTime={new Date(version.start).toISOString()}>{DateTime.fromMillis(version.start).toFormat('yyyy/MM/dd')}</time><time className="calendar-version-end" aria-label="版本结束日期" dateTime={new Date(version.end).toISOString()}>{DateTime.fromMillis(version.end).toFormat('yyyy/MM/dd')}</time></>
 const lanes=<div className="calendar-lanes"><div className="calendar-guides" aria-hidden="true">{axis.ticks.map(tick=><span className="calendar-guide" key={tick.time} style={{left:calendarPosition(tick.time,axis)+'%'}}/>)}</div>{events.map(event=><CalendarEventRow key={event.task.id} event={event} version={version} axis={axis} now={now} onOpen={onOpen}/>)}{!events.length&&<div className="calendar-empty-row"><span>此版本暂无活动</span></div>}</div>
 return <section className={'calendar-game '+(single?'calendar-single-block':'calendar-multi-block')} key={group.id} aria-label={group.name+'活动日历'} data-game-id={group.id} style={{'--game-color':`hsl(${hue} 46% 32%)`,'--game-soft':`hsl(${hue} 40% 96%)`,'--game-edge':`hsl(${hue} 25% 70%)`} as React.CSSProperties}>
  {single?<><header className="calendar-game-heading"><h3 className="calendar-game-tab">{group.name}</h3><span>版本 {version.number}</span><button type="button" className="quiet" onClick={()=>onManage(group)}>管理版本</button></header>{lanes}</>:<div className="calendar-game-layout"><div className="calendar-game-side"><div className="calendar-game-identity"><h3 className="calendar-game-tab calendar-game-vertical">{group.name}</h3><span className="calendar-side-version">版本 {version.number}</span><button type="button" className="quiet" onClick={()=>onManage(group)}>管理版本</button></div></div><div className="calendar-game-body"><header className="calendar-game-heading calendar-version-dates">{dates}</header>{lanes}</div></div>}
  {hasMore&&<div className="calendar-load"><button onClick={onMore} disabled={limit>=10000}>加载更多活动</button><span>已显示前 {events.length} 条</span></div>}
 </section>
}
