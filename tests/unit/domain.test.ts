import {it,expect,describe} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
import {addDays,stateOf,parseInput,localInput} from '../../src/shared/time'
const make=()=>{const db=new Store(join(mkdtempSync(join(tmpdir(),'todo-domain-')),'db.sqlite'));let now=Date.parse('2026-11-18T14:30:00+08:00');const service=new Service(db,()=>now);return {db,service,setTime:(v:number)=>{now=v}}}
describe('阶段3 时间与状态',()=>{
 it('截止边界、补标完成、取消完成',()=>{const {db,service,setTime}=make();const t=service.save({...service.defaultInput('study'),name:'数学',cat:db.read().groups[0].id});expect(stateOf(t,service.now())).toBe('pending');setTime(t.end);expect(stateOf(service.task(t.id)!,service.now())).toBe('overdue');service.complete(t.id,true);expect(stateOf(service.task(t.id)!,service.now())).toBe('done');service.complete(t.id,false);expect(stateOf(service.task(t.id)!,service.now())).toBe('overdue');db.close()})
 it('必填、分类、起止和提醒校验',()=>{const {db,service}=make();const input=service.defaultInput('study');expect(()=>service.save(input)).toThrow('名称');input.name='A';expect(()=>service.save(input)).toThrow('所属');input.cat=db.read().groups[0].id;input.remind=input.end+1;expect(()=>service.save(input)).toThrow('提醒');const game=service.addGroup('game','游戏');expect(()=>service.save({...service.defaultInput('game'),cat:game.id,name:'活动',end:service.now()})).toThrow('结束');db.close()})
 it('编辑未来时间重新判定，已完成不清空',()=>{const {db,service}=make();const input={...service.defaultInput('study'),name:'历史',cat:db.read().groups[0].id,end:service.now()-60000};let t=service.save(input);expect(stateOf(t,service.now())).toBe('overdue');t=service.save({...input,end:service.now()+60000},t.id);expect(stateOf(t,service.now())).toBe('pending');service.complete(t.id,true);t=service.save(input,t.id);expect(stateOf(t,service.now())).toBe('done');db.close()})
 it('本地分钟往返和30天跨月，DST保持规则时分',()=>{const t=parseInput('2026-11-18T14:31');expect(localInput(t)).toBe('2026-11-18T14:31');expect(new Date(addDays(Date.parse('2026-01-31T10:00:00Z'),30,'UTC')).toISOString()).toBe('2026-03-02T10:00:00.000Z');const spring=Date.parse('2026-03-07T09:00:00-05:00');expect(addDays(spring,1,'America/New_York')-spring).toBe(23*3600000)})
})
