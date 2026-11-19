import React,{useEffect,useRef,useState} from 'react'
import {DateTime} from 'luxon'
import type {CalendarEvent,GameCalendarData,Group,Task} from '../shared/types'
import {calendarAxis,calendarPosition} from '../shared/game-calendar'
import {formatTime,localZone} from '../shared/time'
import {call} from './api'
import {Modal} from './Modal'
import {CalendarFrame} from './CalendarFrame'
import {CalendarGameBlock} from './CalendarGameBlock'
export function GameCalendar({cat,revision,onOpen,onManage}:{cat:string;revision:unknown;onOpen:(task:Task)=>void;onManage:(game:Group)=>void}){
 const [data,setData]=useState<GameCalendarData|null>(null),[error,setError]=useState(''),[limit,setLimit]=useState(500),[selected,setSelected]=useState<CalendarEvent|null>(null)
 const horizontal=useRef<HTMLDivElement>(null)
 useEffect(()=>{let active=true;void call<GameCalendarData>('calendar',{cat,limit}).then(value=>{if(active){setData(value);setError('')}}).catch(e=>{if(active)setError((e as Error).message)});return ()=>{active=false}},[cat,limit,revision])
 const axis=data?calendarAxis(data.games.flatMap(g=>g.group.version?[g.group.version]:[]),localZone(),80):null
 const current=axis&&data?calendarPosition(data.now,axis):null,inRange=!!axis&&!!data&&data.now>=axis.start&&data.now<axis.end
 const open=async(event:CalendarEvent)=>{if(event.preview){setSelected(event);return}try{const task=await call<Task|undefined>('detail',{id:event.task.id});if(task)onOpen(task);else setError('该活动已删除或已轮换，请刷新日历')}catch(e){setError((e as Error).message)}}
 if(!data)return <p className="progress" role={error?'alert':'status'}>{error||'正在读取版本活动…'}</p>
 const gameSections=axis&&data.games.filter(g=>g.group.version).map(entry=><CalendarGameBlock key={entry.group.id} entry={entry} axis={axis} now={data.now} single={!!cat} onOpen={event=>void open(event)} onManage={onManage} limit={limit} onMore={()=>setLimit(limit+500)}/>)

 return <section className={'activity-calendar '+(cat?'single-game-calendar':'multi-game-calendar')} aria-label="版本活动日历">
  <div className="calendar-toolbar"><div><h2>活动日历</h2><p>每个活动独占一行 · 虚线长条为未来期次预览</p></div>{axis&&<button onClick={()=>{if(horizontal.current)horizontal.current.scrollTo({left:Math.max(0,(cat?0:110)+(horizontal.current.querySelector<HTMLElement>('.calendar-date-track')?.clientWidth??axis.width)*(inRange?current!:0)/100-horizontal.current.clientWidth/2),behavior:'smooth'})}}>{inRange?'定位今天':'回到版本开始'}</button>}</div>
  {error&&<p role="alert" className="error">{error}</p>}
  {axis&&<div className="calendar-period"><span>{DateTime.fromMillis(axis.start).toFormat('yyyy/MM/dd')} — {DateTime.fromMillis(axis.end-1).toFormat('yyyy/MM/dd')}</span><span className="today-caption">今天 {DateTime.fromMillis(data.now).toFormat('MM/dd')} {!inRange?'· 不在版本日期范围内':''}</span></div>}
  {!axis&&<div className="empty"><p>填写当前版本后即可查看活动日历。</p></div>}
  {axis&&<CalendarFrame axis={axis} now={data.now} viewport={horizontal} labelWidth={cat?0:110}>{gameSections}</CalendarFrame>}
  {data.games.filter(g=>!g.group.version).map(({group})=><div className="calendar-unconfigured" key={group.id}><div><h3>{group.name}</h3><p>尚未填写当前版本</p></div><button onClick={()=>onManage(group)}>设置版本</button></div>)}
  {!data.games.length&&<div className="empty">还没有游戏，请先在游戏主模块添加。</div>}
  {selected&&<Modal title="活动期次预览" onClose={()=>setSelected(null)}><p className="hint">仅为版本内的未来时间预览，未创建待办，也不会提前发送通知。</p><h3 className="detail-title">{selected.task.name}</h3><dl className="details"><dt>开始时间</dt><dd>{formatTime(selected.task.start)}</dd><dt>结束时间</dt><dd>{formatTime(selected.task.end)}</dd><dt>重复周期</dt><dd>每 {selected.task.period} 天</dd><dt>描述</dt><dd>{selected.task.desc||'未填写'}</dd><dt>奖励</dt><dd>{selected.task.reward||'未填写'}</dd></dl><footer><button onClick={()=>setSelected(null)}>关闭预览</button>{selected.sourceId&&<button onClick={async()=>{try{const task=await call<Task|undefined>('detail',{id:selected.sourceId});setSelected(null);if(task)onOpen(task);else setError('当前期次已轮换，请重新查看日历')}catch(e){setError((e as Error).message)}}}>查看当前活动</button>}</footer></Modal>}
 </section>
}
