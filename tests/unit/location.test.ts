import {it,expect,vi} from 'vitest'
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {copyData,dataLocation,saveLocation,startupDataLocation,legacyDataName} from '../../src/main/location'
it('自选目录保留全部数据库和备份',async()=>{const home=mkdtempSync(join(tmpdir(),'todo-location-')),root=dataLocation(home),db=new Store(join(root,'data','app.sqlite'));mkdirSync(join(root,'data','backups'));writeFileSync(join(root,'data','backups','retained.sqlite'),'backup');const target=join(mkdtempSync(join(tmpdir(),'todo-target-')),'D盘数据');mkdirSync(target);await copyData(db,target);saveLocation(home,target);expect(dataLocation(home)).toBe(target);expect(existsSync(db.path)).toBe(true);expect(Store.inspect(join(target,'data','app.sqlite')).state).toEqual(db.read());expect(readFileSync(join(target,'data','backups','retained.sqlite'),'utf8')).toBe('backup');db.close()})
it('问题1 非空、当前目录和复制失败不改变现有数据',async()=>{const home=mkdtempSync(join(tmpdir(),'todo-move-error-')),db=new Store(join(home,'old','data','app.sqlite')),target=join(home,'new');await expect(copyData(db,join(home,'old'))).rejects.toThrow('之外');mkdirSync(target);writeFileSync(join(target,'existing'),'keep');await expect(copyData(db,target)).rejects.toThrow('为空');vi.spyOn(db,'backup').mockRejectedValueOnce(Error('磁盘已满'));await expect(copyData(db,join(home,'failed'))).rejects.toThrow('磁盘已满');expect(existsSync(join(home,'failed'))).toBe(false);expect(db.read().groups).toHaveLength(3);expect(dataLocation(home)).toBe(home);db.close()})

it('旧版程序旁数据库和保护备份迁到安装目录的 data 子目录，保留原库并且不覆盖新数据',async()=>{
 const home=mkdtempSync(join(tmpdir(),'todo-location-')),program=join(home,'program')
 const old=join(program,legacyDataName,'data','app.sqlite'),db=new Store(old)
 db.mutate(state=>{state.groups[0].name='旧数据'})
 db.close()
 mkdirSync(join(program,legacyDataName,'data','backups'))
 writeFileSync(join(program,legacyDataName,'data','backups','keep.sqlite'),'retained')
 const original=readFileSync(old)
 expect(await startupDataLocation(program)).toBe(program)
 const current=new Store(join(program,'data','app.sqlite'))
 try{
  expect(current.read().groups[0].name).toBe('旧数据')
  expect(readFileSync(join(program,'data','backups','keep.sqlite'),'utf8')).toBe('retained')
  expect(readFileSync(old)).toEqual(original)
  current.mutate(state=>{state.groups[0].name='新数据'})
  expect(await startupDataLocation(program)).toBe(program)
  expect(current.read().groups[0].name).toBe('新数据')
 }finally{current.close()}
})
it('旧版外部自选目录保留相对配置',async()=>{
 const home=mkdtempSync(join(tmpdir(),'todo-config-')),program=join(home,'program'),external=join(home,'external')
 const db=new Store(join(external,'data','app.sqlite'));db.close()
 mkdirSync(program);writeFileSync(join(program,'todo-location.json'),JSON.stringify({directory:'../external'}))
 expect(await startupDataLocation(program)).toBe(external)
 expect(dataLocation(program)).toBe(external)
 expect(JSON.parse(readFileSync(join(program,'location.json'),'utf8')).directory).toBe(join('..','external'))
})
it('损坏的旧数据不被空库覆盖，迁移失败保留原件',async()=>{
 const home=mkdtempSync(join(tmpdir(),'todo-broken-')),program=join(home,'program')
 const dir=join(program,legacyDataName,'data');mkdirSync(dir,{recursive:true})
 const source=join(dir,'app.sqlite');writeFileSync(source,'broken')
 await expect(startupDataLocation(program)).rejects.toThrow()
 expect(existsSync(join(program,'data','app.sqlite'))).toBe(false)
 expect(readFileSync(source,'utf8')).toBe('broken')
})
