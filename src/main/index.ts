import { app,BrowserWindow,Tray,Menu,nativeImage,Notification,ipcMain,powerMonitor,dialog } from 'electron'
import { join,dirname } from 'node:path'
import { createHash } from 'node:crypto'
import { writeFileSync,existsSync } from 'node:fs'
import { Store } from './store'
import { Service } from './service'
import { Scheduler } from './scheduler'
import { Recovery } from './recovery'
import { restoreDamagedDatabase } from './startup'
import {removeManagedData} from './uninstall-data'
import {startupDataLocation,copyData,saveLocation,migrateData,isWithin} from './location'
import type { TaskInput,Notice } from '../shared/types'
const test=process.env.TODO_TEST==='1'
const testHome=test?process.env.TODO_HOME:undefined
const dataOverride=test?process.env.TODO_DATA_DIR:undefined
const programHome=testHome?join(testHome,'program'):app.isPackaged?dirname(app.getPath('exe')):app.getAppPath()
const localAppData=process.env.LOCALAPPDATA||join(dirname(app.getPath('appData')),'Local')
const locationHome=dataOverride||programHome
const profileId=createHash('sha256').update(process.platform==='win32'?programHome.toLowerCase():programHome).digest('hex').slice(0,16)
const legacyRoot=join(app.getPath('appData'),'PersonalTodo',app.isPackaged?'data-user':'development')
app.setPath('userData',test?join(dataOverride||testHome||locationHome,'profile'):join(localAppData,'PersonalTodo','profiles',profileId))
app.setName('笺序')
app.setAppUserModelId('local.personal.todo')
let win:BrowserWindow|null=null,tray:Tray|null=null,quitting=false
const removing=(app.isPackaged||test)&&process.argv.includes('--remove-app-data')
if(!app.requestSingleInstanceLock())app.exit(removing?1:0)
else if(removing){
 try{
  app.releaseSingleInstanceLock()
  removeManagedData(locationHome,app.getPath('userData'),test?undefined:legacyRoot)
  if(!test&&app.getLoginItemSettings({path:app.getPath('exe'),args:['--background']}).openAtLogin)app.setLoginItemSettings({openAtLogin:false,path:app.getPath('exe'),args:['--background']})
  app.exit(0)
 }catch(e){console.error(e);app.exit(1)}
}
else {
  app.on('second-instance',()=>{win?.show();win?.focus()})
  app.whenReady().then(async()=>{
    let dataRoot:string
    try{
      dataRoot=dataOverride||await startupDataLocation(locationHome)
      const legacyDb=join(legacyRoot,'data','app.sqlite')
      if(!test&&dataRoot===locationHome&&!existsSync(join(dataRoot,'data'))&&existsSync(legacyDb)){
        const choice=await dialog.showMessageBox({type:'question',message:'发现旧版数据，是否复制到新的数据目录？',detail:'原数据会保留：'+legacyDb,buttons:['复制旧数据','暂不迁移'],defaultId:0,cancelId:1})
        if(choice.response===0){await migrateData(legacyDb,dataRoot);saveLocation(locationHome,dataRoot,[legacyRoot])}
      }
    }catch(e){dialog.showErrorBox('无法准备数据目录',(e as Error).message);app.quit();return}
    const dataPath=join(dataRoot,'data','app.sqlite')
    let db:Store
    while(true){try{db=new Store(dataPath);break}catch(e){
      const choice=await dialog.showMessageBox({type:'error',title:'本地数据无法打开',message:'原文件已保留，可选择备份恢复。',detail:dataPath+'\n'+(e as Error).message,buttons:['选择备份恢复','退出应用'],defaultId:1,cancelId:1})
      if(choice.response!==0){app.quit();return}
      const file=await dialog.showOpenDialog({title:'选择恢复备份',properties:['openFile'],filters:[{name:'SQLite备份',extensions:['sqlite']}]})
      if(file.canceled)continue
      try{const preserved=restoreDamagedDatabase(dataPath,file.filePaths[0]);await dialog.showMessageBox({type:'info',message:'备份已恢复',detail:'原数据文件保留于：'+preserved})}catch(error){await dialog.showMessageBox({type:'error',message:'恢复失败，原数据仍保留',detail:(error as Error).message})}
    }}
    let testNow=test&&process.env.TODO_NOW?Number(process.env.TODO_NOW):null
    const service=new Service(db,()=>testNow??Date.now())
    const recovery=new Recovery(db,()=>service.now())
    let importing=false
    let notificationShows=0,notificationFailures=0
    const liveNotifications=new Set<Notification>()
    const notifyChanged=(event:object={})=>win?.webContents.send('todo:changed',event)
    const show=()=>{if(win?.isMinimized())win.restore();win?.show();win?.focus()}
    const scheduler=new Scheduler(service,(notice:Notice)=>{
      if(!Notification.isSupported())throw Error('此系统不支持通知')
      const n=new Notification({title:notice.kind==='study'?'待办提醒':'游戏活动提醒',body:notice.name+' · '+service.groupName(notice.cat),silent:false})
      liveNotifications.add(n);n.on('show',()=>{notificationShows++});n.on('failed',(_e,error)=>{notificationFailures++;db.mutate(s=>{const row=s.notices.find(x=>x.id===notice.id);if(row)row.system='failed'});notifyChanged({error:'Windows 未显示通知：'+error})});n.on('close',()=>liveNotifications.delete(n));n.on('click',()=>{show();notifyChanged({taskId:notice.taskId})});n.show()
    },notifyChanged)
    const scan=(mode:'live'|'missed'='live')=>{try{scheduler.scan(mode)}catch(e){notifyChanged({error:'提醒检查失败：'+(e as Error).message})}}
    const startupArgs=app.isPackaged?['--background']:[app.getAppPath(),'--background']
    const startupActual=()=>app.getLoginItemSettings({path:app.getPath('exe'),args:startupArgs}).openAtLogin
    const setStartup=(enabled:boolean)=>{app.setLoginItemSettings({openAtLogin:enabled,path:app.getPath('exe'),args:startupArgs});if(startupActual()!==enabled)throw Error('开机自启登记失败，请检查系统启动应用设置')}
    const timer:{current?:ReturnType<typeof setInterval>}={}
    app.on('will-quit',()=>{if(timer.current)clearInterval(timer.current);recovery.cancel();liveNotifications.forEach(n=>n.close());tray?.destroy();db.close()})
    Menu.setApplicationMenu(null)
    win=new BrowserWindow({width:1160,height:820,minWidth:720,minHeight:600,show:!test&&!process.argv.includes('--background'),backgroundColor:'#f7f8fa',icon:join(app.getAppPath(),'assets','icon.png'),webPreferences:{preload:join(__dirname,'../preload/index.js'),contextIsolation:true,nodeIntegration:false,sandbox:true,backgroundThrottling:!test}})
    win.webContents.setWindowOpenHandler(()=>({action:'deny'}))
    win.webContents.on('will-navigate',e=>e.preventDefault())
    win.on('close',e=>{if(!quitting){e.preventDefault();win?.hide();if(!db.read().settings.trayExplained){if(!test)tray?.displayBalloon({title:'笺序已在后台运行',content:'仍会按时提醒。通过托盘菜单可以打开窗口或退出应用。'});db.mutate(s=>{s.settings.trayExplained=true})}}})
    const image=nativeImage.createFromPath(join(app.getAppPath(),'assets','tray.png'))
    tray=new Tray(image);tray.setToolTip('笺序')
    tray.setContextMenu(Menu.buildFromTemplate([{label:'打开主窗口',click:show},{label:'退出应用',click:()=>{quitting=true;app.quit()}}]));tray.on('double-click',show)
    ipcMain.handle('todo:call',async(event,action,payload:any={})=>{
      if(event.sender!==win?.webContents)return {ok:false,error:'非法调用来源'}
      try{
        if((recovery.busy||importing)&&!['snapshot','health','detail','groupCounts','cancelImport','commitImport'].includes(action))throw Error('备份恢复正在进行，请先完成或取消')
        if(action==='snapshot'&&!importing&&!recovery.busy)scan()
        let data:unknown
        switch(action){
          case 'health':data={groups:db.read().groups.length,tray:!!tray,notifications:Notification.isSupported(),path:db.path,notificationShows,notificationFailures,visible:win?.isVisible()};break
          case 'snapshot':data={...service.snapshot(Math.min(Math.max(Number(payload.limit)||100,1),10000),{kind:payload.kind,cat:payload.cat,filter:payload.filter}),notificationSupported:Notification.isSupported(),startupActual:startupActual()};break
          case 'detail':data=service.task(payload.id);break
          case 'calendar':data=service.calendar(typeof payload.cat==='string'?payload.cat:'',Number(payload.limit)||500);break
          case 'addGroup':data=service.addGroup(payload.kind,payload.name,payload.version);break
          case 'updateGame':data=service.updateGame(payload.id,payload.name,payload.version);break
          case 'renameGroup':data=service.renameGroup(payload.id,payload.name);break
          case 'pinGroup':data=service.pinGroup(payload.id,payload.pinned);break
          case 'groupCounts':data=service.groupCounts(payload.id);break
          case 'deleteGroup':data=service.deleteGroup(payload.id);break
          case 'save':data=service.save(payload.input as TaskInput,payload.id,payload.scope);break
          case 'complete':data=service.complete(payload.id,payload.done);break
          case 'delete':data=service.delete(payload.id,payload.scope);break
          case 'readNotices':data=service.readNotices();break
          case 'setSettings':{
            if(typeof payload.notification==='boolean')db.mutate(s=>{s.settings.notification=payload.notification})
            if(typeof payload.startup==='boolean'){setStartup(payload.startup);db.mutate(s=>{s.settings.startup=startupActual()})}
            data=db.read().settings;break
          }
          case 'moveData':{
            const choice=test&&payload.path?{canceled:false,filePaths:[String(payload.path)]}:await dialog.showOpenDialog(win!,{title:'选择空的数据目录',properties:['openDirectory','createDirectory']})
            if(choice.canceled){data=null;break}
            scheduler.paused=true;importing=true
            try{if(isWithin(programHome,choice.filePaths[0]))throw Error('请选择程序目录之外的空文件夹');const target=await copyData(db,choice.filePaths[0]);saveLocation(locationHome,target);data=target;if(!test){app.relaunch();quitting=true;setTimeout(()=>app.quit(),100)}}catch(e){importing=false;scheduler.paused=false;throw e}break
          }
          case 'export':{
            const choice=test&&payload.path?{canceled:false,filePath:String(payload.path)}:await dialog.showSaveDialog(win!,{title:'导出备份',defaultPath:`待办备份-${new Date().toISOString().replace(/[:.]/g,'-')}.sqlite`,filters:[{name:'SQLite 备份',extensions:['sqlite']}]})
            if(choice.canceled||!choice.filePath){data=null;break}data=await recovery.export(choice.filePath);break
          }
          case 'prepareImport':{
            const choice=test&&payload.path?{canceled:false,filePaths:[String(payload.path)]}:await dialog.showOpenDialog(win!,{title:'选择备份',properties:['openFile'],filters:[{name:'SQLite 备份',extensions:['sqlite']}]})
            if(choice.canceled||!choice.filePaths[0]){data=null;break}
            scheduler.paused=true
            try{data=await recovery.prepare(choice.filePaths[0]);importing=true}catch(e){scheduler.paused=false;throw e}break
          }
          case 'cancelImport':recovery.cancel();importing=false;scheduler.paused=false;scan('missed');break
          case 'commitImport':{
            if(!importing)throw Error('没有有效的导入预览')
            recovery.commit(payload.token);importing=false;scheduler.reset();scheduler.paused=false
            try{setStartup(db.read().settings.startup)}catch(e){db.mutate(s=>{s.settings.startup=startupActual()});notifyChanged({error:(e as Error).message})}
            scan('missed');data=true;break
          }
          case 'clear':scheduler.paused=true;try{recovery.clear(payload.word);scheduler.reset();data=true}finally{scheduler.paused=false}break
          case 'testAdvance':if(!test)throw Error('不支持的操作');testNow=(testNow??Date.now())+Number(payload.ms);scan(payload.missed?'missed':'live');data=service.snapshot();break
          case 'openWindow':show();break
          case 'quit':quitting=true;setImmediate(()=>app.quit());break
          default:throw Error('不支持的操作')
        }
        if(!['snapshot','health','detail','groupCounts','calendar'].includes(action)){if(!['quit','openWindow'].includes(action))scan();notifyChanged()}
        return {ok:true,data}
      }catch(e){return {ok:false,error:e instanceof Error?e.message:String(e)}}
    })
    if(process.env.ELECTRON_RENDERER_URL)await win.loadURL(process.env.ELECTRON_RENDERER_URL)
    else await win.loadFile(join(__dirname,'../renderer/index.html'))
    scan('missed')
    powerMonitor.on('resume',()=>{scan('missed');notifyChanged()})
    timer.current=setInterval(()=>{scan();notifyChanged()},15000)
    if(process.env.TODO_SMOKE_RESULT){writeFileSync(process.env.TODO_SMOKE_RESULT,JSON.stringify({groups:db.read().groups.length,tray:!!tray,notifications:Notification.isSupported()}));quitting=true;app.quit()}
  })
  app.on('before-quit',()=>{quitting=true})
}
