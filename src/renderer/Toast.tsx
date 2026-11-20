import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'

type ToastProps={message:string;revision:number;error?:boolean;onDismiss:()=>void;children?:React.ReactNode}

export function Toast({revision,...notice}:ToastProps){
 return createPortal(<ToastNotice key={JSON.stringify([revision,notice.message,notice.error])} {...notice}/>,document.body)
}

function ToastNotice({message,error,onDismiss,children}:Omit<ToastProps,'revision'>){
 const ref=useRef<HTMLDivElement>(null),dismiss=useRef(onDismiss)
 const [leaving,setLeaving]=useState(false)
 dismiss.current=onDismiss
 useEffect(()=>{
  const element=ref.current!
  element.showPopover()
  const timeout=setTimeout(()=>setLeaving(true),4000)
  return ()=>{clearTimeout(timeout);if(element.matches(':popover-open'))element.hidePopover()}
 },[])
 useEffect(()=>{
  if(!leaving)return
  const element=ref.current!
  const animations=element.getAnimations()
  if(!animations.length){dismiss.current();return}
  let cancelled=false
  void Promise.allSettled(animations.map(animation=>animation.finished)).then(()=>{if(!cancelled)dismiss.current()})
  return ()=>{cancelled=true}
 },[leaving])
 return <div ref={ref} popover="manual" className={`floating-toast${error?' failure':''}${leaving?' leaving':''}`} role={error?'alert':'status'} aria-live={error?'assertive':'polite'} aria-atomic="true"><span className="toast-symbol" aria-hidden="true">{error?'!':'✓'}</span><span className="toast-message">{message}</span><div className="toast-actions">{children}<button className="quiet toast-close" aria-label="关闭提示" onClick={()=>setLeaving(true)} disabled={leaving}>×</button></div></div>
}
