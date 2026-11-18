import React,{useEffect,useRef} from 'react'
export function Modal({title,children,onClose,wide=false,drawer=false}:{title:string;children:React.ReactNode;onClose:()=>void;wide?:boolean;drawer?:boolean}){
 const ref=useRef<HTMLDialogElement>(null)
 useEffect(()=>{const current=ref.current;current?.showModal();current?.querySelector<HTMLElement>('[data-initial-focus], [autofocus]')?.focus();return ()=>current?.close()},[])
 return <dialog ref={ref} className={`modal ${wide?'wide':''} ${drawer?'drawer':''}`} aria-label={title} onCancel={e=>{e.preventDefault();onClose()}}><header><h2>{title}</h2><button className="quiet" aria-label="关闭" onClick={onClose}>关闭 ×</button></header>{children}</dialog>
}
export function Confirm({title,children,onCancel,onConfirm,label='确认',danger=false}:{title:string;children:React.ReactNode;onCancel:()=>void;onConfirm:()=>Promise<void>|void;label?:string;danger?:boolean}){
 const [error,setError]=React.useState(''),[busy,setBusy]=React.useState(false)
 return <Modal title={title} onClose={onCancel}>{children}{error&&<p role="alert" className="error">{error}</p>}<footer><button autoFocus data-initial-focus onClick={onCancel} disabled={busy}>取消</button><button className={danger?'danger':'primary'} disabled={busy} onClick={async()=>{setBusy(true);try{await onConfirm()}catch(e){setError((e as Error).message)}finally{setBusy(false)}}}>{busy?'处理中…':label}</button></footer></Modal>
}
