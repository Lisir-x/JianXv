import React from 'react'
import type {Group,Kind,Task} from '../shared/types'
import {TaskCard} from './TaskCard'
export function ModuleNearest({kind,task,groups,onOpen,onComplete,showKind=false,now}:{kind:Kind;task:Task|null;groups:Group[];onOpen:(task:Task)=>void;onComplete:(task:Task)=>void;showKind?:boolean;now:number}){
 const label=kind==='study'?'学习':'游戏'
 return task?<TaskCard task={task} groups={groups} now={now} nearest showKind={showKind} onOpen={onOpen} onComplete={onComplete}/>:<section className="module-nearest" aria-label={label+'最近一项'}><span>{showKind?label+' · ':''}最近</span><p>当前模块暂无待完成{kind==='study'?'事项':'活动'}</p></section>
}
