import React,{useEffect,useState} from 'react'
import type {Group} from '../shared/types'
import {Confirm} from './Modal'
import {call} from './api'
export function DeleteGroup({group,onCancel,onDeleted}:{group:Group;onCancel:()=>void;onDeleted:()=>Promise<void>}){
 const [counts,setCounts]=useState<{items:number;series:number;instances:number;routines:number}|null>(null),[error,setError]=useState('')
 useEffect(()=>{let active=true;void call<{items:number;series:number;instances:number;routines:number}>('groupCounts',{id:group.id}).then(value=>{if(active)setCounts(value)}).catch(e=>{if(active)setError(e.message)});return ()=>{active=false}},[group.id])
 return <Confirm title={'删除'+(group.kind==='study'?'分类':'游戏')} label="连同内容一起删除" danger onCancel={onCancel} onConfirm={async()=>{if(!counts)throw Error(error||'请等待内容数量加载');await call('deleteGroup',{id:group.id});await onDeleted()}}><p>确认删除“{group.name}”？</p>{counts?<p className="muted">将删除 {counts.items} 条普通记录、{counts.series} 个周期系列、{counts.instances} 条指定归属期次{group.kind==='game'&&`、${counts.routines} 条打卡任务及刷新设置`}。此操作无法恢复。</p>:<p role={error?'alert':'status'} className={error?'error':'muted'}>{error||'正在核对关联内容…'}</p>}</Confirm>
}
