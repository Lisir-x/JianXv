import {it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
it('阶段8 最近、各子模块、超期、完成和迁移联动',()=>{
 const db=new Store(join(mkdtempSync(join(tmpdir(),'todo-home-')),'db.sqlite')),svc=new Service(db,()=>Date.parse('2026-11-18T12:00:00Z'));const [a,b]=db.read().groups,g=svc.addGroup('game','游戏');const base=svc.defaultInput('study');const first=svc.save({...base,name:'最近学习',cat:a.id,end:svc.now()+60000});svc.save({...base,name:'以后学习',cat:b.id,end:svc.now()+86400000});svc.save({...base,name:'超期',cat:a.id,end:svc.now()-1});const activity=svc.save({...svc.defaultInput('game'),name:'活动',cat:g.id,end:svc.now()+30000});let snap=svc.snapshot();expect(snap.next?.id).toBe(activity.id);expect(snap.recent).toHaveLength(3);expect(snap.overdueTotal).toBe(1);svc.complete(activity.id,true);expect(svc.snapshot().next?.id).toBe(first.id);svc.save({...first,cat:b.id},first.id);snap=svc.snapshot();expect(snap.recent.some(t=>t.cat===a.id)).toBe(false);expect(snap.recent.find(t=>t.cat===b.id)?.id).toBe(first.id);svc.delete(first.id);expect(svc.snapshot().next?.name).toBe('以后学习');db.close()
})
it('超期总数不受周期列表窗口影响，例外仅调整自身',()=>{
 const db=new Store(join(mkdtempSync(join(tmpdir(),'todo-count-')),'db.sqlite'));const svc=new Service(db,()=>Date.parse('2026-11-18T12:00:00Z')),g=svc.addGroup('game','G');const start=svc.now()-1000*86400000;const first=svc.save({...svc.defaultInput('game'),name:'每日',cat:g.id,start,end:start+3600000,period:1});expect(svc.snapshot(2).overdueTotal).toBe(1000);svc.complete(first.id,true);svc.delete(`${first.seriesId}:1`);expect(svc.snapshot(2).overdueTotal).toBe(998);db.close()
})
