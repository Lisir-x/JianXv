import React from 'react'
import type {Group,Kind,Task} from '../shared/types'
import {TaskCard} from './TaskCard'

export function EmptyNearest({label,action,onAdd,nearest=false}:{label:string;action:string;onAdd:()=>void;nearest?:boolean}){
 return <section className={nearest?'module-nearest empty-nearest':'summary-row empty-nearest'} aria-label={label+'最近一项'}>
  <span className="empty-nearest-label">{label}{nearest&&' · 最近'}</span>
  <p>暂无待完成内容</p>
  <button type="button" onClick={onAdd}>{action}</button>
 </section>
}

export function ModuleNearest({kind,task,groups,onOpen,onComplete,onAdd,showKind=false,now}:{kind:Kind;task:Task|null;groups:Group[];onOpen:(task:Task)=>void;onComplete:(task:Task)=>void;onAdd:()=>void;showKind?:boolean;now:number}){
 const label=kind==='study'?'学习':'游戏'
 const action=groups.some(g=>g.kind===kind)?kind==='study'?'新增事项':'新增活动':kind==='study'?'添加分类':'添加游戏'
 return task?<TaskCard task={task} groups={groups} now={now} nearest showKind={showKind} showVersion={!showKind&&kind==='game'} onOpen={onOpen} onComplete={onComplete}/>:<EmptyNearest label={label} action={action} onAdd={onAdd} nearest/>
}
