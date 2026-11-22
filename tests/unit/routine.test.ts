import {describe,it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {DateTime} from 'luxon'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
import {Recovery} from '../../src/main/recovery'
import {routinePeriod} from '../../src/shared/routine'

const path=()=>join(mkdtempSync(join(tmpdir(),'jianxu-routine-')),'data.sqlite')
describe('日常和周常',()=>{
 it('使用本地日历按分钟和星期计算，跨夏令时保留本地刷新时刻',()=>{
  const settings={daily:'04:00',weekly:'05:00',weekday:1}
  const time=(iso:string)=>DateTime.fromISO(iso,{zone:'America/New_York'}).toMillis()
  const p=routinePeriod(settings,'daily',time('2026-03-07T04:00'),'America/New_York')
  expect(DateTime.fromMillis(p.next,{zone:'America/New_York'}).toFormat('yyyy-MM-dd HH:mm')).toBe('2026-03-08 04:00')
  expect(routinePeriod(settings,'weekly',time('2026-03-09T04:59'),'America/New_York').next).toBe(time('2026-03-09T05:00'))
  expect(routinePeriod(settings,'weekly',time('2026-03-09T05:00'),'America/New_York').start).toBe(time('2026-03-09T05:00'))
 })
 it('各游戏和周期独立，修改规则仅重置变更类型，同值保存不重置',()=>{
  const db=new Store(path());let now=DateTime.local(2026,11,22,21,30).toMillis();const service=new Service(db,()=>now)
  const game=service.addGroup('game','游戏一'),other=service.addGroup('game','游戏二'),settings={daily:'04:00',weekly:'05:00',weekday:1}
  service.setRoutineSettings(game.id,settings);service.setRoutineSettings(other.id,settings)
  const daily=service.saveRoutine(game.id,'每日','daily'),weekly=service.saveRoutine(game.id,'每周','weekly'),another=service.saveRoutine(other.id,'其他','daily')
  for(const [g,t] of [[game,daily],[game,weekly],[other,another]] as const)service.completeRoutine(g.id,t.id,true)
  service.setRoutineSettings(game.id,settings);expect(service.snapshot().routines.every(t=>t.done)).toBe(true)
  service.setRoutineSettings(game.id,{...settings,daily:'06:30'});let snapshot=service.snapshot();expect(snapshot.routines.find(t=>t.id===daily.id)?.done).toBe(false);expect(snapshot.routines.find(t=>t.id===weekly.id)?.done).toBe(true);expect(snapshot.routines.find(t=>t.id===another.id)?.done).toBe(true)
  service.completeRoutine(game.id,daily.id,true);now=DateTime.local(2026,11,23,5).toMillis();snapshot=service.snapshot();expect(snapshot.routines.find(t=>t.id===daily.id)?.done).toBe(true);expect(snapshot.routines.find(t=>t.id===weekly.id)?.done).toBe(false)
  now=DateTime.local(2026,11,23,6,30).toMillis();expect(service.snapshot().routines.find(t=>t.id===daily.id)?.done).toBe(false);expect(service.snapshot().moduleCounts.game.all).toBe(0);db.close()
 })
 it('旧数据兼容，备份恢复与重启保留打卡，删除游戏或清空不留孤立数据',async()=>{
  const file=path();let db=new Store(file),service=new Service(db);const g=service.addGroup('game','游戏');service.setRoutineSettings(g.id,{daily:'04:00',weekly:'05:00',weekday:1});const item=service.saveRoutine(g.id,'测试','daily');service.completeRoutine(g.id,item.id,true)
  const backup=file+'.backup';await new Recovery(db).export(backup);db.close();db=new Store(file);service=new Service(db);expect(service.snapshot().routines[0].done).toBe(true);service.deleteGroup(g.id);expect(service.snapshot().routines).toHaveLength(0)
  const recovery=new Recovery(db),preview=await recovery.prepare(backup);recovery.commit(preview.token);expect(service.snapshot().routines[0].done).toBe(true);recovery.clear('清空');expect(service.snapshot().routines).toHaveLength(0);db.close()
 })
})
