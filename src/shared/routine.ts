import {DateTime} from 'luxon'
import type {RoutineKind,RoutineSettings,RoutineTask} from './types'

export function validateRoutineSettings(value:RoutineSettings):RoutineSettings {
 if(!value||typeof value.daily!=='string'||typeof value.weekly!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.daily)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(value.weekly)||!Number.isInteger(value.weekday)||value.weekday<1||value.weekday>7)throw Error('请填写有效的日常和周常刷新时间')
 for(const field of ['dailyResetAt','weeklyResetAt'] as const)if(value[field]!==undefined&&!Number.isFinite(value[field]))throw Error('打卡刷新状态无效')
 return value
}

// Rules follow the computer's local calendar, including daylight-saving transitions.
export function routinePeriod(settings:RoutineSettings,kind:RoutineKind,now:number,zone?:string){
 const current=DateTime.fromMillis(now,{zone}),[hour,minute]=settings[kind].split(':').map(Number)
 let start=current.startOf('day').set({hour,minute})
 if(kind==='weekly')start=start.minus({days:(start.weekday-settings.weekday+7)%7})
 const days=kind==='daily'?1:7
 if(start.toMillis()>now)start=start.minus({days})
 const next=start.plus({days}).toMillis(),reset=settings[kind==='daily'?'dailyResetAt':'weeklyResetAt']
 return {start:Math.max(start.toMillis(),reset??-Infinity),next}
}
export function routineDone(task:RoutineTask,settings:RoutineSettings,now:number){return task.donePeriod===routinePeriod(settings,task.kind,now).start}
