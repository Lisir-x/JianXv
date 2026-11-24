import React,{useMemo,useState} from 'react'
import type {Group,Notice,Task} from '../shared/types'
import {formatTime} from '../shared/time'
import {call} from './api'
import {Confirm,Modal} from './Modal'

export function NoticeCenter({notices,groups,onClose,onChanged,onOpen}:{notices:Notice[];groups:Group[];onClose:()=>void;onChanged:()=>Promise<void>;onOpen:(task:Task)=>void}){
 const [confirm,setConfirm]=useState<'clear'|string|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false)
 const ordered=useMemo(()=>[...notices].sort((a,b)=>Number(a.read)-Number(b.read)||b.recordedAt-a.recordedAt),[notices]),unread=ordered.filter(n=>!n.read),read=ordered.filter(n=>n.read)
 const groupName=(id:string)=>groups.find(g=>g.id===id)?.name??'已删除'
 const open=async(notice:Notice)=>{const result=await call<Task|undefined>('detail',{id:notice.taskId});onClose();if(result)onOpen(result)}
 const markAll=async()=>{setBusy(true);setError('');try{await call('readNotices');await onChanged()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const confirmAction=async()=>{if(!confirm)return;setBusy(true);setError('');try{await call(confirm==='clear'?'deleteReadNotices':'deleteNotice',confirm==='clear'?{}:{id:confirm});setConfirm(null);await onChanged()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const record=(n:Notice)=><article className={'notice-record '+(n.read?'read':'unread')} key={n.id}><span className="notice-dot" aria-hidden="true"/><div className="notice-copy"><button className="notice-name" onClick={()=>void open(n)}>{n.name}</button><span className="notice-meta"><span>{n.kind==='study'?'学习':'游戏'} · {groupName(n.cat)}</span><span>计划 {formatTime(n.scheduledAt)}</span><span>记录 {formatTime(n.recordedAt)}</span>{n.missed&&<strong>启动／恢复补记</strong>}{n.system==='failed'&&<strong>通知失败已保留</strong>}</span></div><div className="notice-actions">{n.read?<button className="notice-delete" disabled={busy} onClick={()=>setConfirm(n.id)}>删除</button>:<button disabled={busy} onClick={()=>void call('readNotices').then(onChanged).catch(e=>setError(e.message))}>标为已读</button>}</div></article>
 return <><Modal title="提醒记录" onClose={onClose}><div className="notice-toolbar"><p><strong>{unread.length}</strong> 条未读 · 新提醒置顶显示</p><div className="notice-toolbar-actions"><button className="quiet" disabled={busy||!read.length} onClick={()=>setConfirm('clear')}>清空已读</button><button disabled={busy||!unread.length} onClick={()=>void markAll()}>全部标为已读</button></div></div>{error&&<p className="error" role="alert">{error}</p>}<section className="notice-section"><h3>未读提醒 <small>新 → 旧</small><span>{unread.length}</span></h3>{unread.length?unread.map(record):<p className="notice-empty">暂无未读提醒</p>}</section><section className="notice-section"><h3>已读提醒 <small>新 → 旧</small><span>{read.length}</span></h3>{read.length?read.map(record):<p className="notice-empty">暂无已读提醒</p>}</section></Modal>{confirm&&<Confirm title={confirm==='clear'?'清空已读提醒':'删除已读提醒'} label={confirm==='clear'?'确认清空':'确认删除'} danger onCancel={()=>setConfirm(null)} onConfirm={confirmAction}><p>{confirm==='clear'?'确认清空全部已读提醒？':'确认删除这条已读提醒？'}</p></Confirm>}</>
}
