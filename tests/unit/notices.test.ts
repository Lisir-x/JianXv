import {describe,it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {join} from 'node:path'
import {tmpdir} from 'node:os'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'

describe('提醒记录管理',()=>{
 it('未读不可直接删除，已读可单条删除或全部清空',()=>{
  const db=new Store(join(mkdtempSync(join(tmpdir(),'jianxu-notices-')),'data','app.sqlite')),service=new Service(db),now=Date.now(),task=service.save({kind:'study',cat:db.read().groups[0].id,name:'测试提醒',start:null,end:now+3600000,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'})
  db.mutate(s=>{s.notices.push({id:`${task.id}@${now}`,taskId:task.id,scheduledAt:now,recordedAt:now,missed:false,read:false,name:task.name,kind:task.kind,cat:task.cat,system:'not-requested'})})
  expect(()=>service.deleteNotice(`${task.id}@${now}`)).toThrow('未读')
  service.readNotices();service.deleteNotice(`${task.id}@${now}`);expect(db.read().notices).toHaveLength(0)
  db.mutate(s=>{s.notices.push({id:`${task.id}@${now+1}`,taskId:task.id,scheduledAt:now+1,recordedAt:now+1,missed:false,read:true,name:task.name,kind:task.kind,cat:task.cat,system:'not-requested'})});service.deleteReadNotices();expect(db.read().notices).toHaveLength(0);db.close()
 })
})
