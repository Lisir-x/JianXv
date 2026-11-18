import React from 'react'
import type {Group,Kind,Task} from '../shared/types'
import {formatTime} from '../shared/time'
export function ModuleNearest({kind,task,groups,onOpen,onComplete}:{kind:Kind;task:Task|null;groups:Group[];onOpen:(task:Task)=>void;onComplete:(task:Task)=>void}){
 const label=kind==='study'?'学习':'游戏'
 return <section className={'module-nearest '+(task?'clickable':'')} aria-label={label+'最近一项'} onClick={()=>{if(task)onOpen(task)}}><div className="nearest-copy"><span className="eyebrow">最近一项{task?' · '+(groups.find(g=>g.id===task.cat)?.name??''):''}</span>{task?<><button className="text nearest-name" aria-label={'查看最近事项：'+task.name} onClick={e=>{e.stopPropagation();onOpen(task)}}>{task.name}</button><span className="meta">{formatTime(task.end)} {kind==='study'?'截止':'结束'}</span></>:<p className="muted">当前模块暂无待完成{kind==='study'?'事项':'活动'}</p>}</div>{task&&<button aria-label="完成最近事项" onClick={e=>{e.stopPropagation();onComplete(task)}}>标记完成</button>}</section>
}
