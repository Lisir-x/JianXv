export type Kind='study'|'game'
export type Status='pending'|'overdue'|'done'
export type Scope='one'|'future'
export interface Group {id:string;kind:Kind;name:string;createdAt:number;updatedAt:number}
export interface Task {
  id:string;kind:Kind;cat:string;name:string;start:number|null;end:number;remind:number|null;
  desc:string;reward:string;period:number;zone:string;createdAt:number;updatedAt:number;doneAt:number|null;
  seriesId?:string;index?:number
}
export interface Segment {from:number;until:number|null;period:number;base:Task;zone:string}
export interface Series {id:string;createdAt:number;segments:Segment[];firstId?:string;currentIndex?:number;currentOnly?:boolean}
export interface Exception {id:string;seriesId:string;index:number;patch:Partial<Task>;deleted:boolean}
export interface Notice {id:string;taskId:string;scheduledAt:number;recordedAt:number;missed:boolean;read:boolean;name:string;kind:Kind;cat:string;system:'not-requested'|'submitted'|'failed'}
export interface Settings {notification:boolean;startup:boolean;trayExplained:boolean;lastBackup:number|null;lastScan?:number|null}
export interface State {groups:Group[];items:Task[];series:Series[];exceptions:Exception[];notices:Notice[];settings:Settings}
export interface TaskInput {name:string;kind:Kind;cat:string;start:number|null;end:number;remind:number|null;desc:string;reward:string;period:number;zone:string}
export interface Snapshot {groups:Group[];tasks:Task[];recent:Task[];next:Task|null;overdue:Task[];overdueTotal:number;notices:Notice[];settings:Settings;now:number;path:string;hasMore:boolean;notificationSupported:boolean;startupActual:boolean}
export interface Result<T=unknown> {ok:boolean;data?:T;error?:string}
export interface TodoBridge {call:<T=unknown>(action:string,payload?:unknown)=>Promise<Result<T>>;subscribe:(listener:(event:{taskId?:string;error?:string})=>void)=>()=>void}
