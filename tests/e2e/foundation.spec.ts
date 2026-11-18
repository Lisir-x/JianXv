import { test,expect,_electron as electron } from '@playwright/test'
import { mkdtempSync,readFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
test('桌面基础、SQLite持久化与托盘',async()=>{
  const dir=mkdtempSync(join(tmpdir(),'todo-foundation-'))
  for(let i=0;i<2;i++){
    const instance=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:dir}})
    const page=await instance.firstWindow()
    await expect(page.getByRole('heading',{name:'接下来，做什么？',exact:true})).toBeVisible()
    const health=await page.evaluate(()=> (window as any).todo.call('health'))
    expect(health.ok).toBe(true);expect(health.data.groups).toBe(i===0?3:4);expect(health.data.tray).toBe(true);expect(health.data.notifications).toBe(true)
    if(i===0)expect((await page.evaluate(()=> (window as any).todo.call('addGroup',{kind:'game',name:'持久化游戏'}))).ok).toBe(true)
    const rejected=await page.evaluate(()=> (window as any).todo.call('unknown'));expect(rejected.ok).toBe(false)
    await instance.close()
  }
  expect(readFileSync(join(dir,'data','app.sqlite')).subarray(0,15).toString()).toBe('SQLite format 3')
})
