import React,{useEffect,useRef,useState} from 'react'
import {DateTime} from 'luxon'
import type {CalendarEvent,GameCalendarData,Group,Task} from '../shared/types'
import {calendarAxis,calendarPosition,calendarSpan} from '../shared/game-calendar'
import {formatTime,localZone,stateOf} from '../shared/time'
import {call} from './api'
import {Modal} from './Modal'
import {CalendarFrame} from './CalendarFrame'
export function GameCalendar({cat,revision,onOpen,onManage}:{cat:string;revision:unknown;onOpen:(task:Task)=>void;onManage:(game:Group)=>void}){
 const [data,setData]=useState<GameCalendarData|null>(null),[error,setError]=useState(''),[limit,setLimit]=useState(500),[selected,setSelected]=useState<CalendarEvent|null>(null)
 const horizontal=useRef<HTMLDivElement>(null)
 useEffect(()=>{let active=true;void call<GameCalendarData>('calendar',{cat,limit}).then(value=>{if(active){setData(value);setError('')}}).catch(e=>{if(active)setError((e as Error).message)});return ()=>{active=false}},[cat,limit,revision])
 const axis=data?calendarAxis(data.games.flatMap(g=>g.group.version?[g.group.version]:[]),localZone()):null
 const current=axis&&data?calendarPosition(data.now,axis):null,inRange=!!axis&&!!data&&data.now>=axis.start&&data.now<axis.end
 const open=async(event:CalendarEvent)=>{if(event.preview){setSelected(event);return}try{const task=await call<Task|undefined>('detail',{id:event.task.id});if(task)onOpen(task);else setError('该活动已删除或已轮换，请刷新日历')}catch(e){setError((e as Error).message)}}
 if(!data)return <p className="progress" role={error?'alert':'status'}>{error||'正在读取版本活动…'}</p>
 const gameSections=axis&&<>    {data.games.filter(g=>g.group.version).map(({group,events,hasMore,hue})=>{
     const version=group.version!
     return <section key={group.id} className="calendar-game" style={{'--game-color':`hsl(${hue} 46% 32%)`,'--game-soft':`hsl(${hue} 40% 96%)`,'--game-edge':`hsl(${hue} 25% 70%)`} as React.CSSProperties} aria-label={group.name+'活动日历'} data-game-id={group.id}>
      <header className="calendar-game-heading"><h3 className="calendar-game-tab">{group.name}</h3><span>版本 {version.number} · {formatTime(version.start)} — {formatTime(version.end)}</span><button className="quiet" onClick={()=>onManage(group)}>管理版本</button></header>
      <div className="calendar-lanes"><div className="calendar-guides" aria-hidden="true">{axis.ticks.map(tick=><span className="calendar-guide" key={tick.time} style={{left:calendarPosition(tick.time,axis)+'%'}}/>)}{!cat&&inRange&&<span className="calendar-today-line" style={{left:current+'%'}}/>}</div>
       {events.map(event=>{const t=event.task,span=calendarSpan(t,version,axis),status=stateOf(t,data.now),title=`${t.name}\n${formatTime(t.start)} — ${formatTime(t.end)}${event.preview?'\n未来期次预览':status==='done'?'\n已完成':''}`;return <div className="calendar-event-row calendar-grid-row" key={t.id} data-event-id={t.id} data-preview={event.preview}>
        <button className="calendar-event-name" onClick={()=>void open(event)} title={title}>{t.name}<span>{event.preview?'未来预览':status==='done'?'已完成':status==='overdue'?'已超期':t.start!>data.now?'未开始':'进行中'}</span></button>
        <div className="calendar-event-track"><button type="button" className={`calendar-event-bar ${event.preview?'preview':''} ${status==='done'?'completed':''}`} aria-label={(event.preview?'预览活动：':'查看活动：')+t.name+' '+formatTime(t.start)} title={title} style={{left:span.left+'%',width:span.width+'%'}} onClick={()=>void open(event)}><span>{span.clippedStart?'‹ ':''}{t.name}{span.clippedEnd?' ›':''}</span></button></div>
       </div>})}
       {!events.length&&<div className="calendar-empty-row calendar-grid-row"><span>此版本暂无活动</span><span/></div>}
      </div>
      {hasMore&&<div className="calendar-load"><button onClick={()=>setLimit(limit+500)} disabled={limit>=10000}>加载更多活动</button><span>已显示前 {events.length} 条</span></div>}
     </section>
    })}</>

 return <section className={'activity-calendar '+(cat?'single-game-calendar':'')} aria-label="版本活动日历">
  <div className="calendar-toolbar"><div><h2>活动日历</h2><p>每个活动独占一行 · 虚线长条为未来期次预览</p></div>{axis&&<button onClick={()=>{if(horizontal.current)horizontal.current.scrollTo({left:Math.max(0,180+(horizontal.current.querySelector<HTMLElement>('.calendar-date-track')?.clientWidth??axis.width)*(inRange?current!:0)/100-horizontal.current.clientWidth/2),behavior:'smooth'})}}>{inRange?'定位今天':'回到版本开始'}</button>}</div>
  {error&&<p role="alert" className="error">{error}</p>}
  {axis&&<div className="calendar-period"><span>{DateTime.fromMillis(axis.start).toFormat('yyyy/MM/dd')} — {DateTime.fromMillis(axis.end-1).toFormat('yyyy/MM/dd')}</span><span className="today-caption">今天 {DateTime.fromMillis(data.now).toFormat('MM/dd')} {!inRange?'· 不在版本日期范围内':''}</span></div>}
  {!axis&&<div className="empty"><p>填写当前版本后即可查看活动日历。</p></div>}
  {axis&&(cat?<CalendarFrame axis={axis} now={data.now} viewport={horizontal}>{gameSections}</CalendarFrame>:<><div className="calendar-horizontal" ref={horizontal} aria-label="活动日历横向日期轴" tabIndex={0}>
   <div className="calendar-sheet" style={{'--timeline-width':axis.width+'px'} as React.CSSProperties}>
    <div className="calendar-date-header calendar-grid-row"><div className="calendar-name-head">活动 / 版本</div><div className="calendar-date-track">{axis.ticks.map(tick=><span className="calendar-date" key={tick.time} style={{left:calendarPosition(tick.time,axis)+'%'}}>{tick.label}</span>)}{inRange&&<span className="calendar-today-label" style={{left:current+'%'}}>今天</span>}</div></div>
{gameSections}
   </div>
  </div></>)}
  {data.games.filter(g=>!g.group.version).map(({group})=><div className="calendar-unconfigured" key={group.id}><div><h3>{group.name}</h3><p>尚未填写当前版本</p></div><button onClick={()=>onManage(group)}>设置版本</button></div>)}
  {!data.games.length&&<div className="empty">还没有游戏，请先在游戏主模块添加。</div>}
  {selected&&<Modal title="活动期次预览" onClose={()=>setSelected(null)}><p className="hint">仅为版本内的未来时间预览，未创建待办，也不会提前发送通知。</p><h3 className="detail-title">{selected.task.name}</h3><dl className="details"><dt>开始时间</dt><dd>{formatTime(selected.task.start)}</dd><dt>结束时间</dt><dd>{formatTime(selected.task.end)}</dd><dt>重复周期</dt><dd>每 {selected.task.period} 天</dd><dt>描述</dt><dd>{selected.task.desc||'未填写'}</dd><dt>奖励</dt><dd>{selected.task.reward||'未填写'}</dd></dl><footer><button onClick={()=>setSelected(null)}>关闭预览</button>{selected.sourceId&&<button onClick={async()=>{try{const task=await call<Task|undefined>('detail',{id:selected.sourceId});setSelected(null);if(task)onOpen(task);else setError('当前期次已轮换，请重新查看日历')}catch(e){setError((e as Error).message)}}}>查看当前活动</button>}</footer></Modal>}
 </section>
}
