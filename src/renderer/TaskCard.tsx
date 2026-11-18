import React from 'react'
import type {Group,Task} from '../shared/types'
import {formatTime,stateOf} from '../shared/time'
export function TaskCard({task:t,groups,now,onOpen,onComplete}:{task:Task;groups:Group[];now:number;onOpen:(t:Task)=>void;onComplete:(t:Task)=>void}){
 const status=stateOf(t,now)
 return <article className="task-row" data-task-id={t.id} onClick={()=>onOpen(t)}><button className="check" aria-label={`${t.doneAt===null?'完成':'取消完成'} ${t.name}`} onClick={e=>{e.stopPropagation();onComplete(t)}}>{t.doneAt!==null?'✓':''}</button><button type="button" className="task-open" aria-label={t.name} onClick={e=>{e.stopPropagation();onOpen(t)}}><span className="task-copy"><span className="task-name">{t.name}</span><span className="meta"><span>{groups.find(g=>g.id===t.cat)?.name}</span><span>{t.kind==='game'?`${formatTime(t.start)} → `:''}{formatTime(t.end)}</span>{t.period>0&&<span>↻ 每 {t.period} 天</span>}{t.remind!==null&&<span>有提醒</span>}</span>{t.doneAt!==null&&<span className="meta">完成于 {formatTime(t.doneAt)}</span>}</span><span className={`badge ${status}`}>{({pending:'待完成',overdue:'已超期',done:'已完成'})[status]}</span></button></article>
}
