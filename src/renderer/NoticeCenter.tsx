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
 const markRead=async(id?:string)=>{setBusy(true);setError('');try{if(id===undefined)await call('readNotices');else await call('readNotice',{id});await onChanged()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const confirmAction=async()=>{if(!confirm)return;setBusy(true);setError('');try{await call(confirm==='clear'?'deleteReadNotices':'deleteNotice',confirm==='clear'?{}:{id:confirm});setConfirm(null);await onChanged()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const record=(n:Notice)=><article className={'notice-record '+(n.read?'read':'unread')} key={n.id}>
  <div className="notice-copy">
   <div className="notice-title-line">
    {!n.read&&<span className="notice-dot" aria-hidden="true"/>}
    <button className="quiet notice-name" onClick={()=>void open(n)}>{n.name}</button>
    {!n.read&&<span className="notice-count">未读</span>}
    <span className="notice-category">{n.kind==='study'?'学习':'游戏'} · {groupName(n.cat)}</span>
   </div>
   <div className="notice-meta">
    <span>计划 {formatTime(n.scheduledAt)}</span><span>记录 {formatTime(n.recordedAt)}</span>
    {n.missed&&<span>启动／恢复补记</span>}{n.system==='failed'&&<span>通知失败已保留</span>}
   </div>
  </div>
  <div className="notice-actions">{n.read?<button className="quiet notice-delete" disabled={busy} onClick={()=>setConfirm(n.id)}>删除</button>:<button className="quiet notice-mark" disabled={busy} onClick={()=>void markRead(n.id)}>标为已读</button>}</div>
 </article>
 return <>
  <Modal title="提醒记录" onClose={onClose}>
   <div className="notice-list" tabIndex={0} role="region" aria-label="提醒列表">
    {error&&<p className="error" role="alert">{error}</p>}
    <section className="notice-section">
     <div className="notice-group"><h3>未读提醒<span className="notice-count">{unread.length}</span></h3><button className="quiet notice-action notice-mark-all" disabled={busy||!unread.length} onClick={()=>void markRead()}>全部标为已读</button></div>
     {unread.length?unread.map(record):<p className="notice-empty">暂无未读提醒</p>}
    </section>
    <section className="notice-section">
     <div className="notice-group"><h3>已读提醒<span className="notice-count">{read.length}</span></h3><button className="quiet notice-action notice-clear" disabled={busy||!read.length} onClick={()=>setConfirm('clear')}>清空已读</button></div>
     {read.length?read.map(record):<p className="notice-empty">暂无已读提醒</p>}
    </section>
   </div>
  </Modal>
  {confirm&&<Confirm title={confirm==='clear'?'清空已读提醒':'删除已读提醒'} label={confirm==='clear'?'确认清空':'确认删除'} danger onCancel={()=>setConfirm(null)} onConfirm={confirmAction}><p>{confirm==='clear'?'确认清空全部已读提醒？':'确认删除这条已读提醒？'}</p></Confirm>}
 </>
}
