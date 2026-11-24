import {describe,it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
import {Scheduler} from '../../src/main/scheduler'
const make=()=>{const db=new Store(join(mkdtempSync(join(tmpdir(),'todo-alarm-')),'db.sqlite'));let now=Date.parse('2026-11-18T12:00:00Z');const svc=new Service(db,()=>now),submitted:string[]=[];const scheduler=new Scheduler(svc,n=>submitted.push(n.id));const input={...svc.defaultInput('study'),name:'提醒',cat:db.read().groups[0].id,remind:now+60000};return {db,svc,scheduler,input,submitted,advance:(n:number)=>{now+=n}}}
describe('阶段9 持久化提醒',()=>{
 it('到点一次、重复扫描和重启不重复',()=>{const {db,svc,scheduler,input,submitted,advance}=make();svc.save(input);scheduler.scan('missed');advance(60000);expect(scheduler.scan()).toHaveLength(1);scheduler.scan();expect(submitted).toHaveLength(1);new Scheduler(svc,n=>submitted.push(n.id)).scan('missed');expect(submitted).toHaveLength(1);expect(db.read().notices).toHaveLength(1);db.close()})
 it('标为已读只影响单条，删除及清空在重启扫描后都不会恢复',()=>{
  const {db,svc,scheduler,input,advance,submitted}=make()
  const a=svc.save(input),b=svc.save({...input,name:'另一条提醒'}),aId=`${a.id}@${input.remind}`,bId=`${b.id}@${input.remind}`
  scheduler.scan();advance(60000);expect(scheduler.scan()).toHaveLength(2)
  svc.readNotice(aId);expect(db.read().notices.find(n=>n.id===bId)?.read).toBe(false)
  svc.deleteNotice(aId);expect(scheduler.scan()).toHaveLength(0)
  expect(db.read().notices.map(n=>n.id)).toEqual([bId])
  svc.readNotices();svc.deleteReadNotices();expect(scheduler.scan()).toHaveLength(0)
  const path=db.path;db.close()
  const reopened=new Store(path),service=new Service(reopened,()=>svc.now()),afterRestart=new Scheduler(service,n=>submitted.push(n.id))
  try{
   expect(afterRestart.scan('missed')).toHaveLength(0);expect(reopened.read().notices).toHaveLength(0)
   expect(submitted).toHaveLength(2);expect(service.task(a.id)?.doneAt).toBeNull()
   service.save({...input,remind:service.now()+60000},a.id);advance(60000)
   expect(afterRestart.scan()?.map(n=>n.id)).toEqual([`${a.id}@${service.now()}`])
   service.delete(a.id);expect(reopened.read().settings.dismissedNoticeIds).toEqual([bId])
  }finally{reopened.close()}
 })
 it('提前完成和删除不提醒，取消完成不重发旧提醒',()=>{const {db,svc,scheduler,input,submitted,advance}=make();const a=svc.save(input),b=svc.save({...input,name:'删除'});svc.complete(a.id,true);svc.delete(b.id);advance(60000);scheduler.scan();expect(submitted).toHaveLength(0);svc.complete(a.id,false);scheduler.scan();expect(db.read().notices).toHaveLength(1);expect(submitted).toHaveLength(0);db.close()})
 it('改新时间使旧计划失效，新时间只发送一次',()=>{const {db,svc,scheduler,input,submitted,advance}=make();const t=svc.save(input);scheduler.scan();svc.save({...input,remind:input.remind!+60000},t.id);advance(60000);scheduler.scan();expect(submitted).toHaveLength(0);advance(60000);scheduler.scan();expect(submitted).toHaveLength(1);svc.complete(t.id,true);svc.complete(t.id,false);scheduler.scan();expect(submitted).toHaveLength(1);db.close()})
 it('关闭系统通知仍有记录，启动与过去输入只补记',()=>{const {db,svc,scheduler,input,submitted,advance}=make();svc.save(input);db.mutate(s=>{s.settings.notification=false});advance(60000);scheduler.scan();expect(db.read().notices).toHaveLength(1);expect(submitted).toHaveLength(0);svc.save({...input,name:'过去输入'});advance(10000);scheduler.scan();expect(db.read().notices.every(n=>n.system==='not-requested')).toBe(true);new Scheduler(svc,n=>submitted.push(n.id)).scan('missed');expect(submitted).toHaveLength(0);db.close()})
 it('周期只补记当前，完成旧期和删除本期独立',()=>{const {db,svc,scheduler,input,advance}=make();const g=svc.addGroup('game','游戏'),t=svc.save({...input,kind:'game',cat:g.id,start:svc.now(),end:svc.now()+3600000,period:1});svc.complete(t.id,true);advance(3*86400000+60000);scheduler.scan('missed');expect(db.read().notices).toHaveLength(1);const current=svc.snapshot().tasks[0];expect(current.index).toBe(3);expect(db.read().notices[0].taskId).toBe(current.id);svc.delete(current.id);expect(db.read().notices).toHaveLength(0);db.close()})
 it('系统通知失败保留应用内记录，不反复重试弹窗',()=>{const {db,svc,input,advance}=make();svc.save(input);const scheduler=new Scheduler(svc,()=>{throw Error('系统拒绝')});scheduler.scan();advance(60000);scheduler.scan();expect(db.read().notices[0].system).toBe('failed');expect(scheduler.scan()).toHaveLength(0);db.close()})
 it('新期建立时清理旧期提醒，终止后不再轮换',()=>{const {db,svc,input,scheduler,advance}=make(),g=svc.addGroup('game','游戏');svc.save({...input,kind:'game',cat:g.id,start:svc.now(),end:svc.now()+2*86400000,period:1});advance(60000);scheduler.scan();expect(db.read().notices).toHaveLength(1);advance(86400000);scheduler.scan('missed');const current=svc.snapshot().tasks[0];expect(db.read().notices).toHaveLength(1);expect(db.read().notices[0].taskId).toBe(current.id);svc.delete(current.id,'future');expect(db.read().notices).toHaveLength(0);advance(86400000);expect(svc.snapshot().tasks).toHaveLength(0);db.close()})
 it('提醒等于周期结束时投递一次，旧期记录删除且下一期正常',()=>{const {db,svc,scheduler,input,submitted,advance}=make(),g=svc.addGroup('game','结束提醒'),start=svc.now(),t=svc.save({...input,kind:'game',cat:g.id,start,period:1,remind:start+86400000});scheduler.scan();advance(86400000);scheduler.scan();expect(submitted).toEqual([t.id+'@'+t.end]);expect(svc.task(t.id)).toBeUndefined();expect(db.read().notices).toHaveLength(0);expect(svc.snapshot().tasks).toHaveLength(1);scheduler.scan();expect(submitted).toHaveLength(1);db.close()})
})
