import {DateTime} from 'luxon'
import type {GameVersion} from './types'
export function validateGameVersion(value:GameVersion):GameVersion {
 if(!value||typeof value.number!=='string'||!value.number.trim())throw Error('请填写游戏版本号')
 if(!Number.isFinite(value.start)||!Number.isFinite(value.end)||!DateTime.fromMillis(value.start).isValid||!DateTime.fromMillis(value.end).isValid)throw Error('请填写有效的版本开始时间与结束时间')
 if(value.end<=value.start)throw Error('版本结束时间必须晚于开始时间')
 return {number:value.number.trim(),start:value.start,end:value.end}
}
