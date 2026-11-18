import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'
test('阶段12 大数据桌面渲染和加载更多',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'todo-load-ui-')),db=new Store(join(dir,'data','app.sqlite')),svc=new Service(db),s=db.read(),now=Date.now();s.groups.push({id:'load-game',name:'负载游戏',kind:'game',createdAt:now,updatedAt:now});for(let i=0;i<1000;i++)s.items.push({...svc.defaultInput('study'),id:'load-item-'+i,name:'学习事项'+i,cat:s.groups[0].id,end:now+60000+i*60000,createdAt:now,updatedAt:now,doneAt:null});for(let i=0;i<50;i++)s.series.push({id:'load-series-'+i,createdAt:now,segments:[{from:0,until:null,period:1,zone:'Asia/Shanghai',base:{...svc.defaultInput('game'),id:'base-'+i,name:'每日活动'+i,cat:'load-game',start:now,end:now+3600000,period:1,createdAt:now,updatedAt:now,doneAt:null}}]});db.write(s);db.close()
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
 try{const page=await app.firstWindow();await expect(page.locator('.hero')).toContainText('学习事项0');await page.getByRole('button',{name:'游戏',exact:true}).click();await expect(page.locator('.task-name')).toHaveCount(100);await page.getByRole('button',{name:'加载更多',exact:true}).click();await expect(page.locator('.task-name')).toHaveCount(200);const ids=await page.evaluate(async()=>{const r=await window.todo.call<any>('snapshot',{kind:'game',filter:'pending',limit:200});return r.data.tasks.map((t:any)=>t.id)});expect(new Set(ids).size).toBe(200);await page.getByRole('button',{name:'学习',exact:true}).click();await expect(page.locator('.task-name')).toHaveCount(100);await page.getByRole('button',{name:'加载更多',exact:true}).click();await expect(page.locator('.task-name')).toHaveCount(200)}finally{await app.close()}
})
