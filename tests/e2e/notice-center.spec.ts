import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {Store} from '../../src/main/store'
import {Service} from '../../src/main/service'

for (const unreadCount of [1,12]) test(`提醒记录紧凑布局与管理（${unreadCount} 条未读）`,async()=>{
 const dir=mkdtempSync(join(tmpdir(),'jianxu-notice-ui-')),db=new Store(join(dir,'data','app.sqlite')),service=new Service(db),now=Date.now(),task=service.save({kind:'study',cat:db.read().groups[0].id,name:'新提醒事项',start:null,end:now+3600000,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'});db.mutate(s=>{for(let i=0;i<unreadCount+2;i++)s.notices.push({id:`${task.id}@${now+i}`,taskId:task.id,scheduledAt:now+i,recordedAt:now+i,missed:i===0,read:i>=unreadCount,name:i===0?'新提醒事项':`已读提醒${i}`,kind:task.kind,cat:task.cat,system:'not-requested'})});db.close()
 const options={...(process.env.JIANXU_TEST_EXE?{executablePath:process.env.JIANXU_TEST_EXE,args:[]}:{args:['.']}),env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}}
 const app=await electron.launch(options)
 try{const page=await app.firstWindow();await page.waitForSelector('nav');await page.locator('.topbar').getByRole('button',{name:/提醒/}).click();const modal=page.getByRole('dialog',{name:'提醒记录'});await expect(modal.locator('.notice-section').first().locator('.notice-record')).toHaveCount(unreadCount);await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(2);await expect(modal.locator('.notice-record').first()).toHaveClass(/unread/);await expect(modal.locator('.notice-record').last()).toHaveClass(/read/)
  await expect(modal).not.toContainText('新提醒置顶显示');await expect(modal).not.toContainText('新 → 旧')
  const list=modal.getByRole('region',{name:'提醒列表'}), first=list.locator('.notice-record').first()
  const markAll=modal.locator('.notice-section').first().getByRole('button',{name:'全部标为已读'})
  const clear=modal.locator('.notice-section').last().getByRole('button',{name:'清空已读'})
  await expect(markAll).toHaveCSS('background-color','rgba(0, 0, 0, 0)')
  if(unreadCount===1){
   for(const button of [first.getByRole('button',{name:'标为已读',exact:true}),modal.getByRole('button',{name:'删除',exact:true}).first()]){
    await modal.locator('h2').hover()
    const background=await button.evaluate(el=>getComputedStyle(el).backgroundColor)
    const border=await button.evaluate(el=>getComputedStyle(el).borderTopColor)
    expect(background).not.toBe('rgba(0, 0, 0, 0)')
    await button.hover()
    await expect(button).not.toHaveCSS('background-color',background)
    await expect(button).not.toHaveCSS('border-top-color',border)
   }
  }
  await expect(list.locator('.notice-record').nth(unreadCount-1)).toContainText('新提醒事项')
  await expect(first.locator('.notice-count')).toHaveText('未读')
  await expect(first.locator('.notice-meta')).toContainText('计划')
  await expect(first.locator('.notice-meta')).toContainText('记录')
  await expect(list).toContainText('启动／恢复补记')
  expect(await first.evaluate(el=>el.getBoundingClientRect().height)).toBeLessThan(95)
  if(unreadCount>1){
   const header=modal.locator('header'),top=(await header.boundingBox())?.y
   expect(await list.evaluate(el=>el.scrollHeight>el.clientHeight)).toBe(true)
   await list.evaluate(el=>{el.scrollTop=el.scrollHeight})
   expect(await list.evaluate(el=>el.scrollTop)).toBeGreaterThan(0)
   expect((await header.boundingBox())?.y).toBe(top)
   await expect(modal.getByRole('button',{name:'关闭'})).toBeInViewport()
   const selected=first.locator('.notice-name'),name=await selected.innerText()
   await first.getByRole('button',{name:'标为已读',exact:true}).click()
   await expect(modal.locator('.notice-section').first().locator('.notice-record')).toHaveCount(unreadCount-1)
   await expect(modal.locator('.notice-section').last().getByRole('button',{name,exact:true})).toBeVisible()
   await markAll.click()
  }else await modal.getByRole('button',{name:'标为已读',exact:true}).click()
  await expect(modal.locator('.notice-section').first().locator('.notice-record')).toHaveCount(0)
  await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(unreadCount+2)
  await modal.getByRole('button',{name:'删除'}).first().click()
  await page.getByRole('dialog',{name:'删除已读提醒'}).getByRole('button',{name:'确认删除'}).click()
  await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(unreadCount+1)
  await clear.click()
  await page.getByRole('dialog',{name:'清空已读提醒'}).getByRole('button',{name:'确认清空'}).click()
  await expect(modal.locator('.notice-section').last().locator('.notice-record')).toHaveCount(0)
 }finally{await app.close()}
})
