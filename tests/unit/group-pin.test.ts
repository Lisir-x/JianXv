import {it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
import {orderedGroups} from '../../src/shared/group-order'
it('未置顶且创建时间相同的默认分类保留既有顺序',()=>{const common={kind:'study' as const,createdAt:1,updatedAt:1};const groups=[{...common,id:'z',name:'作业'},{...common,id:'a',name:'实验'},{...common,id:'m',name:'考试'}];expect(orderedGroups(groups).map(g=>g.name)).toEqual(['作业','实验','考试']);expect(orderedGroups([{...groups[0]},{...groups[1],pinnedAt:null},groups[2]]).map(g=>g.name)).toEqual(['作业','实验','考试'])})
it('子模块置顶/取消置顶顺序持久化，不跨主模块，兼容旧字段',async()=>{const file=join(mkdtempSync(join(tmpdir(),'todo-pin-')),'app.sqlite'),db=new Store(file),svc=new Service(db),groups=db.read().groups;svc.pinGroup(groups[1].id,true);expect(orderedGroups(db.read().groups)[0].id).toBe(groups[1].id);svc.pinGroup(groups[2].id,true);expect(orderedGroups(db.read().groups)[0].id).toBe(groups[2].id);svc.pinGroup(groups[2].id,false);expect(orderedGroups(db.read().groups)[0].id).toBe(groups[1].id);const backup=file+'.backup';await db.backup(backup);expect(Store.inspect(backup).state.groups.find(g=>g.id===groups[1].id)?.pinnedAt).not.toBeNull();db.close();const reopened=new Store(file);expect(orderedGroups(reopened.read().groups)[0].id).toBe(groups[1].id);expect(()=>new Service(reopened).pinGroup('missing',true)).toThrow();expect(()=>reopened.mutate(s=>{s.groups[0].pinnedAt=NaN})).toThrow();reopened.close()})
