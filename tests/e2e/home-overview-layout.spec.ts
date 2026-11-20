import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'

test('首页总览区分状态、分模块统计并显示完成率；空卡片直达添加表单',async()=>{
 const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-overview-'))}})
 try{
  const page=await app.firstWindow();await page.waitForSelector('nav')
  const game=page.getByRole('region',{name:'游戏最近一项',exact:true})
  await expect(game).toContainText('暂无待完成内容')
  const games=page.getByRole('region',{name:'游戏子模块概览'})
  await expect(games.getByText('暂无游戏',{exact:true})).toBeVisible()
  await expect(games.locator('.summary-row,.home-group-grid')).toHaveCount(0)
  await expect(games.getByRole('button')).toHaveCount(1)
  await games.getByRole('button',{name:'添加游戏'}).click()
  await expect(page.getByRole('dialog',{name:'添加游戏'})).toBeVisible()
  await page.getByRole('button',{name:'取消',exact:true}).click()
  const child=page.getByRole('region',{name:'实验最近一项',exact:true})
  await expect(child).toContainText('暂无待完成内容')
  await child.getByRole('button',{name:'新增事项'}).click()
  await expect(page.getByRole('dialog',{name:'新增事项'}).getByLabel('所属分类 *').locator('option:checked')).toHaveText('实验')
  await page.getByRole('button',{name:'取消',exact:true}).click()
  await page.evaluate(async()=>{
   const {data:s}=await window.todo.call<import('../../src/shared/types').Snapshot>('snapshot')
   if(!s)throw Error('snapshot missing')
   const {data:g}=await window.todo.call<{id:string}>('addGroup',{kind:'game',name:'游戏统计',version:{number:'1',start:s.now-86400000,end:s.now+86400000}})
   if(!g)throw Error('group missing')
   const item={kind:'study',cat:s.groups[0].id,name:'统计测试',start:null,end:s.now+3600000,remind:null,desc:'',reward:'',period:0,zone:'Asia/Shanghai'}
   const {data:done}=await window.todo.call<{id:string}>('save',{input:item})
   await window.todo.call('complete',{id:done?.id,done:true})
   await window.todo.call('save',{input:{...item,kind:'game',cat:g.id,start:s.now-3600000,end:s.now-60000}})
  })
  const stats=page.getByRole('region',{name:'总览',exact:true})
  await expect(stats.locator('.overview-count strong')).toHaveText(['0','1','1','2'])
  await expect(stats.getByRole('progressbar',{name:'完成率'})).toHaveAttribute('value','50')
  await expect(stats.getByRole('row',{name:'学习 0 0 1'})).toBeVisible()
  await expect(stats.getByRole('row',{name:'游戏 0 1 0'})).toBeVisible()
  await expect(games.getByText('暂无游戏',{exact:true})).toHaveCount(0)
  await expect(games.getByRole('region',{name:'游戏统计最近一项'})).toContainText('暂无待完成内容')
  const misalignment=await stats.getByRole('table',{name:'模块统计'}).evaluate(table=>{
   const columns=[...table.querySelectorAll('thead th')].slice(1)
   return [...table.querySelectorAll('tbody tr')].flatMap(row=>[...row.querySelectorAll('td')].map((cell,i)=>{
    const text=document.createRange();text.selectNodeContents(cell)
    const number=text.getBoundingClientRect(),heading=columns[i].getBoundingClientRect()
    return Math.abs(number.left+number.width/2-heading.left-heading.width/2)
   }))
  })
  expect(misalignment).toHaveLength(6)
  expect(Math.max(...misalignment)).toBeLessThan(1)
  const colors=await stats.locator('.overview-count').evaluateAll(els=>els.map(el=>getComputedStyle(el).backgroundColor))
  expect(new Set(colors).size).toBe(4)
  await game.getByRole('button',{name:'新增活动'}).click()
  await expect(page.getByRole('dialog',{name:'新增活动'})).toBeVisible()
  await page.getByRole('button',{name:'取消',exact:true}).click()
  await page.getByRole('navigation',{name:'主导航'}).getByRole('button',{name:'学习',exact:true}).click()
  await page.getByRole('region',{name:'学习最近一项'}).getByRole('button',{name:'新增事项'}).click()
  await expect(page.getByRole('dialog',{name:'新增事项'})).toBeVisible()
 }finally{await app.close()}
})
