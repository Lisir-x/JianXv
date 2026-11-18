import type {TodoBridge} from '../shared/types'
declare global {interface Window {todo:TodoBridge}}
export async function call<T=unknown>(action:string,payload?:unknown):Promise<T>{const r=await window.todo.call<T>(action,payload);if(!r.ok)throw Error(r.error||'操作失败');return r.data as T}
