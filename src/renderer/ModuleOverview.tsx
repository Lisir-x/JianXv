import React from 'react'
import type {Kind,Snapshot,Status,Task} from '../shared/types'
import {formatTime,sortTasks} from '../shared/time'
import {ModuleNearest} from './ModuleNearest'
import {orderedGroups} from '../shared/group-order'
import {UiIcon} from './UiIcon'

export function ModuleOverview({kind,data,onOpen,onComplete,onAdd,onRoute,onFilter,onRoutine}:{kind:Kind;data:Snapshot;onOpen:(task:Task)=>void;onComplete:(task:Task)=>void;onAdd:()=>void;onRoute:(id:string,status?:Status)=>void;onFilter:(status:Status)=>void;onRoutine:()=>void}){
 const nearest=sortTasks(data.recent.filter(t=>t.kind===kind))[0]??null
 const upcoming=data.upcoming.filter(t=>t.kind===kind&&t.id!==nearest?.id).slice(0,4)
 const groups=orderedGroups(data.groups.filter(g=>g.kind===kind)),overdue=data.moduleOverdue[kind]
 const states=[['pending','待完成'],['overdue','已超期'],['done','已完成']] as const
 return <div className="module-overview">
  <div className="overview-top"><section className="overview-nearest"><h2><UiIcon name="bookmark"/>最近一项</h2><ModuleNearest kind={kind} task={nearest} groups={data.groups} now={data.now} onOpen={onOpen} onComplete={onComplete} onAdd={onAdd}/></section>
   <section className="overview-upcoming"><h2><UiIcon name="calendarClock"/>接下来 <small>按结束时间</small></h2><div className="overview-agenda">{upcoming.length?upcoming.map(task=><button type="button" key={task.id} className="agenda-row" onClick={()=>onOpen(task)}><strong>{task.name}</strong><span>{data.groups.find(g=>g.id===task.cat)?.name}</span><time>{formatTime(task.end)}</time></button>):<p className="muted agenda-empty">没有其他待完成内容。</p>}<button className="quiet agenda-more" onClick={()=>onFilter('pending')}>查看全部待完成 →</button></div></section></div>
  {kind==='game'?<section className="overview-brief"><UiIcon name="checklist"/><strong>本期打卡</strong><span className="badge">日常剩 {data.routines.filter(t=>t.kind==='daily'&&!t.done).length} 项</span><span className="badge">周常剩 {data.routines.filter(t=>t.kind==='weekly'&&!t.done).length} 项</span><button className="quiet" onClick={onRoutine}>查看打卡清单 →</button></section>:data.moduleCounts.study.overdue>0&&<section className="overview-brief"><UiIcon name="clock"/><strong>需要补处理</strong><span className="badge overdue">{data.moduleCounts.study.overdue} 项已超期</span>{overdue&&<span className="muted">{overdue.name}</span>}<button className="quiet" onClick={()=>onFilter('overdue')}>查看已超期 →</button></section>}
  <section className="overview-groups"><h2><UiIcon name="list"/>按{kind==='study'?'分类':'游戏'}看进度</h2><table aria-label={'按'+(kind==='study'?'分类':'游戏')+'统计状态'}><thead><tr><th>{kind==='study'?'分类':'游戏'}</th>{states.map(([s,label])=><th key={s}>{label}</th>)}</tr></thead><tbody>{groups.map(g=><tr key={g.id}><th scope="row"><button className="text" onClick={()=>onRoute(g.id)}>{g.name} ›</button></th>{states.map(([s,label])=>{const n=data.groupCounts[g.id]?.[s]??0;return <td key={s}>{n?<button className={'group-count '+s} aria-label={`${g.name}：${label} ${n} 项`} onClick={()=>onRoute(g.id,s)}>{n}</button>:0}</td>})}</tr>)}</tbody></table>{!groups.length&&<p className="empty">暂无{kind==='study'?'分类':'游戏'}</p>}</section>
 </div>
}
