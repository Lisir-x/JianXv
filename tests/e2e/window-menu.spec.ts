import {test,expect,_electron as electron} from '@playwright/test'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join} from 'node:path'
test('主窗口不显示应用菜单',async()=>{const app=await electron.launch({args:['.'],env:{...process.env,TODO_TEST:'1',TODO_DATA_DIR:mkdtempSync(join(tmpdir(),'todo-menu-'))}});try{await app.firstWindow();expect(await app.evaluate(({Menu})=>Menu.getApplicationMenu())).toBeNull()}finally{await app.close()}})
