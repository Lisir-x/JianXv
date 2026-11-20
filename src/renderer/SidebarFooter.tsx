import React,{useState} from 'react'
import {SidebarIcon} from './SidebarIcon'
import {Confirm} from './Modal'
import {call} from './api'
export function SidebarFooter(){
 const [confirm,setConfirm]=useState(false)
 return <footer className="sidebar-footer"><p>本地记录 · 随时接着做</p><button className="sidebar-exit" type="button" onClick={()=>setConfirm(true)}><SidebarIcon name="exit"/>退出应用</button>{confirm&&<Confirm title="退出应用？" label="确认退出" onCancel={()=>setConfirm(false)} onConfirm={async()=>{await call('quit')}}><p>退出后停止后台提醒并释放文件占用，已保存的数据不会丢失。</p><p className="muted">如果只想关闭窗口并继续接收提醒，请取消后关闭主窗口。</p></Confirm>}</footer>
}
