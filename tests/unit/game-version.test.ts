import {describe,it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
import {Recovery} from '../../src/main/recovery'
const setup=()=>{const dir=mkdtempSync(join(tmpdir(),'todo-version-')),db=new Store(join(dir,'app.sqlite')),svc=new Service(db);return {dir,db,svc}}
const version={number:' 2.4 ',start:Date.parse('2026-11-01T10:00:00+08:00'),end:Date.parse('2026-12-13T10:00:00+08:00')}
describe('当前游戏版本',()=>{
 it('新增/修改版本及重启保留，不修改活动归属',()=>{const {db,svc}=setup(),g=svc.addGroup('game','原神',version),task=svc.save({...svc.defaultInput('game'),name:'活动',cat:g.id});expect(g.version?.number).toBe('2.4');svc.updateGame(g.id,'原神新版',{...version,number:'2.5'});const file=db.path;db.close();const reopened=new Store(file);expect(reopened.read().groups.find(x=>x.id===g.id)?.version?.number).toBe('2.5');expect(reopened.read().items.find(x=>x.id===task.id)?.cat).toBe(g.id);reopened.close()})
 it('空版本/非法时间/重复名称原子拒绝',()=>{const {db,svc}=setup(),g=svc.addGroup('game','甲',version);svc.addGroup('game','乙');const before=db.read();for(const invalid of [{...version,number:''},{...version,end:version.start},{...version,start:NaN}])expect(()=>svc.updateGame(g.id,'已修改名称',invalid)).toThrow();expect(()=>svc.updateGame(g.id,'乙',version)).toThrow();expect(db.read()).toEqual(before);expect(()=>svc.addGroup('study','错误版本',version)).toThrow();db.close()})
 it('旧游戏无版本仍可打开，之后可补全',()=>{const {db,svc}=setup(),g=svc.addGroup('game','旧游戏'),file=db.path;db.close();const reopened=new Store(file),service=new Service(reopened);expect(reopened.read().groups.find(x=>x.id===g.id)?.version).toBeUndefined();service.updateGame(g.id,g.name,version);expect(service.snapshot().groups.find(x=>x.id===g.id)?.version?.number).toBe('2.4');reopened.close()})
 it('快照导入导出包含版本，非法版本备份拒绝',async()=>{const {dir,db,svc}=setup(),g=svc.addGroup('game','游戏',version),recovery=new Recovery(db),file=join(dir,'backup.sqlite');await recovery.export(file);svc.updateGame(g.id,g.name,{...version,number:'新版本'});const p=await recovery.prepare(file);recovery.commit(p.token);expect(db.read().groups.find(x=>x.id===g.id)?.version?.number).toBe('2.4');expect(()=>db.mutate(s=>{s.groups.find(x=>x.id===g.id)!.version={...version,end:0}})).toThrow();db.close()})
})
