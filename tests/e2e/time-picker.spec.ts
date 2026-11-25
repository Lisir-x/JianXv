import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
import {chooseTime} from './time-helper'
test('问题6 时间明确确认才写回，取消不变，提醒可清除',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-time-picker-'))}});try{const page=await app.firstWindow();await page.getByRole('button',{name:'学习',exact:true}).click();await page.getByRole('button',{name:'＋ 新增事项'}).click();const original=await page.getByLabel('结束时间 *',{exact:true}).inputValue();await page.getByRole('button',{name:'选择结束时间 *',exact:true}).click();let panel=page.getByRole('dialog',{name:'选择时间',exact:true});await panel.getByLabel('小时',{exact:true}).selectOption('03');await panel.getByRole('button',{name:'取消',exact:true}).click();await expect(page.getByLabel('结束时间 *',{exact:true})).toHaveValue(original);await chooseTime(page,'结束时间 *','2028-02-29T23:47');await expect(page.getByLabel('结束时间 *',{exact:true})).toHaveValue('2028-02-29 23:47');await expect(page.getByRole('dialog',{name:'选择时间'})).toHaveCount(0);await chooseTime(page,'提醒时间（可留空）','2028-02-29T22:46');await page.getByRole('button',{name:'选择提醒时间（可留空）',exact:true}).click();panel=page.getByRole('dialog',{name:'选择时间'});await panel.getByRole('button',{name:'清除时间'}).click();await expect(page.getByLabel('提醒时间（可留空）',{exact:true})).toHaveValue('');await page.getByLabel('事项名称 *').fill('确认时间');await page.getByRole('button',{name:'选择结束时间 *',exact:true}).click();await page.keyboard.press('Escape');await expect(page.getByRole('dialog',{name:'选择时间'})).toHaveCount(0);await expect(page.getByRole('dialog',{name:'新增事项',exact:true})).toBeVisible();await expect(page.getByRole('dialog',{name:'放弃未保存的修改？'})).toHaveCount(0);await page.getByLabel('所属分类 *').selectOption({label:'作业'});await page.getByRole('button',{name:'保存',exact:true}).click();await page.getByRole('button',{name:'查看最近事项：确认时间',exact:true}).click();await expect(page.getByRole('dialog',{name:'事项详情'})).toContainText('2028-02-29 23:47')}finally{await app.close()}})

test('游戏版本时间默认填充，游戏和学习支持键入并保存时间',async()=>{
 const now=Date.parse('2026-11-26T12:00:00+08:00'),start=now-86400000,end=now+86400000
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_NOW:String(now),TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-time-typing-'))}})
 try{
  const page=await app.firstWindow();await page.waitForSelector('nav')
  await page.evaluate(({start,end})=>window.todo.call('addGroup',{kind:'game',name:'手输测试游戏',version:{number:'2.0',start,end}}),{start,end})
  await page.locator('nav').getByRole('button',{name:'手输测试游戏',exact:true}).click()
  await page.getByRole('button',{name:/新增/}).first().click()
  let editor=page.getByRole('dialog',{name:'新增活动'})
  const local=(ms:number)=>{const d=new Date(ms);return new Date(ms-d.getTimezoneOffset()*60000).toISOString().slice(0,16).replace('T',' ')}
  await expect(editor.getByLabel('开始时间 *',{exact:true})).toHaveValue(local(start))
  await expect(editor.getByLabel('结束时间 *',{exact:true})).toHaveValue(local(end))
  await expect(editor.getByLabel('提醒时间（可留空）',{exact:true})).toHaveAttribute('placeholder','年-月-日 时:分')
  await editor.getByLabel('活动名称 *').fill('手输活动')
  await editor.getByLabel('开始时间 *',{exact:true}).fill(local(now))
  await editor.getByLabel('结束时间 *',{exact:true}).fill(local(now+3600000))
  await editor.getByLabel('提醒时间（可留空）',{exact:true}).fill(local(now+1800000))
  await editor.getByRole('button',{name:'保存',exact:true}).click();await expect(editor).toBeHidden()
  await page.locator('nav').getByRole('button',{name:'学习',exact:true}).click()
  await page.getByRole('button',{name:/新增/}).first().click()
  editor=page.getByRole('dialog',{name:'新增事项'})
  await editor.getByLabel('事项名称 *').fill('手输事项')
  await editor.getByLabel('所属分类 *').selectOption({label:'作业'})
  await editor.getByLabel('结束时间 *',{exact:true}).fill(local(now+7200000))
  await editor.getByLabel('提醒时间（可留空）',{exact:true}).fill('无效时间')
  await editor.getByRole('button',{name:'保存',exact:true}).click();await expect(editor.getByRole('alert')).toBeVisible()
  await editor.getByLabel('提醒时间（可留空）',{exact:true}).fill(local(now+3600000))
  await editor.getByRole('button',{name:'保存',exact:true}).click();await expect(editor).toBeHidden()
  const tasks=(await page.evaluate(()=>window.todo.call<import('../../src/shared/types').Snapshot>('snapshot',{filter:'all'}))).data!.tasks
  expect(tasks.find(t=>t.name==='手输活动')).toMatchObject({start:now,end:now+3600000,remind:now+1800000})
  expect(tasks.find(t=>t.name==='手输事项')).toMatchObject({start:null,end:now+7200000,remind:now+3600000})
 }finally{await app.close()}
})
