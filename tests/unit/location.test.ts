import {it,expect,vi} from 'vitest'
import {mkdtempSync,mkdirSync,writeFileSync,existsSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {copyData,dataLocation,saveLocation} from '../../src/main/location'
it('问题1 默认路径跟随程序，修改目录保留全部数据库和备份',async()=>{const home=mkdtempSync(join(tmpdir(),'todo-location-')),root=dataLocation(home),db=new Store(join(root,'data','app.sqlite'));mkdirSync(join(root,'data','backups'));writeFileSync(join(root,'data','backups','retained.sqlite'),'backup');const target=join(home,'D盘数据');mkdirSync(target);await copyData(db,target);saveLocation(home,target);expect(dataLocation(home)).toBe(target);expect(existsSync(db.path)).toBe(true);expect(Store.inspect(join(target,'data','app.sqlite')).state).toEqual(db.read());expect(readFileSync(join(target,'data','backups','retained.sqlite'),'utf8')).toBe('backup');db.close()})
it('问题1 非空、当前目录和复制失败不改变现有数据',async()=>{const home=mkdtempSync(join(tmpdir(),'todo-move-error-')),db=new Store(join(home,'old','data','app.sqlite')),target=join(home,'new');await expect(copyData(db,join(home,'old'))).rejects.toThrow('之外');mkdirSync(target);writeFileSync(join(target,'existing'),'keep');await expect(copyData(db,target)).rejects.toThrow('为空');vi.spyOn(db,'backup').mockRejectedValueOnce(Error('磁盘已满'));await expect(copyData(db,join(home,'failed'))).rejects.toThrow('磁盘已满');expect(existsSync(join(home,'failed'))).toBe(false);expect(db.read().groups).toHaveLength(3);expect(dataLocation(home)).toBe(join(home,'我的待办数据'));db.close()})
