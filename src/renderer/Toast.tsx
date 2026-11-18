import React,{useEffect,useRef,useState} from 'react'
import {createPortal} from 'react-dom'
export function Toast({message,revision,error,onDismiss,children}:{message:string;revision:number;error?:boolean;onDismiss:()=>void;children?:React.ReactNode}){
 const ref=useRef<HTMLDivElement>(null),dismiss=useRef(onDismiss)
 const [leaving,setLeaving]=useState(false)
 dismiss.current=onDismiss
 useEffect(()=>{setLeaving(false);ref.current?.showPopover();const exit=setTimeout(()=>setLeaving(true),4000),remove=setTimeout(()=>dismiss.current(),4300);return ()=>{clearTimeout(exit);clearTimeout(remove)}},[message,revision,error])
 return createPortal(<div ref={ref} popover="manual" className={`floating-toast ${error?'failure':''} ${leaving?'leaving':''}`} role={error?'alert':'status'} aria-live={error?'assertive':'polite'}><span className="toast-symbol" aria-hidden="true">{error?'!':'✓'}</span><span className="toast-message">{message}</span><div className="toast-actions">{children}<button className="quiet" aria-label="关闭提示" onClick={onDismiss}>×</button></div></div>,document.body)
}
