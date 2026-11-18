import { describe,it,expect } from 'vitest'
import { mkdtempSync,writeFileSync,readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Store } from '../../src/main/store'
const file=()=>join(mkdtempSync(join(tmpdir(),'todo-store-')),'app.sqlite')
describe('阶段2 SQLite数据基础',()=>{
 it('首次初始化、删除默认分类、重启保留',()=>{const path=file();let db=new Store(path);expect(db.read().groups.map(g=>g.name)).toEqual(['作业','实验','考试']);db.mutate(s=>{s.groups.splice(0,1)});db.close();db=new Store(path);expect(db.read().groups).toHaveLength(2);db.close()})
 it('无效归属和失败事务不写入',()=>{const db=new Store(file()),before=db.read();expect(()=>db.mutate(s=>{s.groups.push({...s.groups[0]})})).toThrow();expect(db.read()).toEqual(before);expect(()=>db.mutate(s=>{s.groups=[];throw Error('模拟失败')})).toThrow();expect(db.read()).toEqual(before);db.close()})
 it('损坏数据库保留原始文件',()=>{const path=file();writeFileSync(path,'damaged');expect(()=>new Store(path)).toThrow();expect(readFileSync(path,'utf8')).toBe('damaged')})
 it('WAL期间导出独立快照、原库变化不影响备份',async()=>{const path=file(),db=new Store(path);const backup=path+'.backup.sqlite';await db.backup(backup);db.mutate(s=>{s.groups=[]});expect(Store.inspect(backup).state.groups).toHaveLength(3);db.close()})
})
