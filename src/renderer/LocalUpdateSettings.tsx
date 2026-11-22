import React,{useEffect,useState} from 'react'
import type {LocalUpdatePreview,UpdateLocation} from '../main/local-update'
import {call} from './api'
import {Modal} from './Modal'

type UpdateInfo=UpdateLocation&{version:string}
export function LocalUpdateSettings(){
 const [info,setInfo]=useState<UpdateInfo|null>(null),[preview,setPreview]=useState<LocalUpdatePreview|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('')
 useEffect(()=>{let active=true;void call<UpdateInfo>('updateInfo').then(value=>{if(active)setInfo(value)}).catch(e=>{if(active)setError(e.message)});return()=>{active=false}},[])
 const choose=async()=>{setBusy(true);setError('');try{const value=await call<LocalUpdatePreview|null>('prepareLocalUpdate');if(value)setPreview(value)}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const close=()=>{if(busy)return;void call('cancelLocalUpdate').catch(()=>{});setPreview(null);setError('')}
 const reveal=async()=>{setBusy(true);try{await call('revealLocalUpdate',{token:preview?.token})}catch(e){setError((e as Error).message)}finally{setBusy(false)}}
 const start=async()=>{setBusy(true);setError('');try{await call('startLocalUpdate',{token:preview?.token})}catch(e){setError((e as Error).message);setBusy(false)}}
 return <><section className="settings-group" aria-label="软件更新"><header className="settings-group-heading"><span className="settings-category">本机维护</span><h2>软件更新</h2></header><div className="settings-group-body"><div className="settings-row"><div><h3>当前版本 {info?.version??'…'}</h3><p>使用已下载的本地安装包更新，无需联网。</p></div><button disabled={busy||!info} onClick={()=>void choose()}>选择本地安装包</button></div><p className="settings-note">更新前请确认安装包来自可信来源。应用不能验证安装包的发布者或版本新旧。</p>{error&&!preview&&<p className="error" role="alert">{error}</p>}</div></section>
 {preview&&info&&<Modal title="本地软件更新" onClose={close}><p>安装包：<span className="pre-wrap">{preview.path}</span></p><p className="update-fingerprint">SHA-256：{preview.sha256}</p><p>当前程序目录：<span className="pre-wrap">{info.programPath}</span></p>{info.installed?<p className="hint">当前程序位于已登记的安装目录。继续后将先创建数据保护备份，再启动安装程序并彻底退出笺序；请在安装向导中确认更新。安装过程或结果由安装程序提示。</p>:<p className="hint">当前程序不在已登记的安装目录，可能是解包版或移动后的副本。为避免更新到其他位置，不能从这里直接启动安装程序。请先导出备份，再打开安装包所在位置并自行核对安装目标。{info.registeredPaths.length>0&&<>已登记目录：{info.registeredPaths.join('；')}</>}</p>}<p className="muted">文件格式检查和哈希不能证明安装包来自笺序，也不能判断是否为新版；请仅使用可信来源。</p>{error&&<p className="error" role="alert">{error}</p>}<footer><button autoFocus data-initial-focus disabled={busy} onClick={close}>取消</button><button disabled={busy} onClick={()=>void reveal()}>打开安装包位置</button>{info.installed&&<button className="primary" disabled={busy} onClick={()=>void start()}>{busy?'正在准备…':'备份并启动安装程序'}</button>}</footer></Modal>}</>
}
