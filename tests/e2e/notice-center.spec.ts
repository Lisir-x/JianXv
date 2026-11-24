import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'

test('提醒记录未读置顶、已读可删除并支持清空',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jianxu-notice-ui-')),db=new Store(join(dir,'data','app.sqlite')),service=new Service(db),now=Date.now(),task=service.save({kind:'study',cat:db.read().groups[0].id,name:'新提醒事项',start:null,end:now+3600000,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'});db.mutate(s=>{for(let i=0;i<3;i++)s.notices.push({id:`${task.id}@${now+i}`,taskId:task.id,scheduledAt:now+i,recordedAt:now+i,missed:false,read:i>0,name:i===0?'新提醒事项':`已读提醒${i}`,kind:task.kind,cat:task.cat,system:'not-requested'})});db.close()
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}}
 const app=await electron.launch(options)
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.locator('.topbar').getByRole('button',{name:/提醒/}).click();const modal=page.getByRole('dialog',{name:'提醒记录'});await expect(modal.locator('.notice-section').first().locator('.notice-record')).toHaveCount(1);await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(2);await expect(modal.locator('.notice-record').first()).toHaveClass(/unread/);await expect(modal.locator('.notice-record').last()).toHaveClass(/read/)
  await modal.getByRole('button',{name:'标为已读',exact:true}).click();await expect(modal.locator('.notice-section').first().locator('.notice-record')).toHaveCount(0);await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(3);await expect(modal.getByRole('button',{name:'删除'}).first()).toBeVisible();await modal.getByRole('button',{name:'删除'}).first().click();await page.getByRole('dialog',{name:'删除已读提醒'}).getByRole('button',{name:'确认删除'}).click();await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(2);await modal.getByRole('button',{name:'清空已读'}).click();await page.getByRole('dialog',{name:'清空已读提醒'}).getByRole('button',{name:'确认清空'}).click();await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(0)
 }finally{await app.close()}
})
