import {it,expect} from 'vitest'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
it('问题5 数量独立于分页和当前状态，随归属和完成更新',()=>{const db=new Store(join(mkdtempSync(join(tmpdir(),'todo-counts-')),'db.sqlite')),svc=new Service(db),s=db.read(),[a,b]=s.groups,now=svc.now();for(let i=0;i<125;i++)s.items.push({...svc.defaultInput('study'),id:'i'+i,name:'记录'+i,cat:i<120?a.id:b.id,createdAt:now,updatedAt:now,end:now+(i<10?-60000:3600000),doneAt:i<5?now:null});db.write(s);expect(svc.snapshot(10,{kind:'study',filter:'pending'}).counts).toEqual({pending:115,overdue:5,done:5,all:125});expect(svc.snapshot(10,{cat:a.id,filter:'done'}).counts).toEqual({pending:110,overdue:5,done:5,all:120});svc.complete('i10',true);expect(svc.snapshot(10,{cat:a.id}).counts.done).toBe(6);svc.delete('i11');expect(svc.snapshot(10,{cat:a.id}).counts.all).toBe(119);db.close()})
