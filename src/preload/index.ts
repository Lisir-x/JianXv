import { contextBridge,ipcRenderer } from 'electron'
contextBridge.exposeInMainWorld('todo',{
  call:(action:string,payload?:unknown)=>ipcRenderer.invoke('todo:call',action,payload),
  subscribe:(listener:(event:unknown)=>void)=>{const handler=(_event:unknown,data:unknown)=>listener(data);ipcRenderer.on('todo:changed',handler);return ()=>ipcRenderer.removeListener('todo:changed',handler)}
})
