import {DateTime} from 'luxon'
import type {GameVersion} from './types'
export function validateGameVersion(value:GameVersion):GameVersion {
 if(!value||typeof value.number!=='string'||!value.number.trim())throw Error('请填写游戏版本号')
 if(!Number.isFinite(value.start)||!Number.isFinite(value.end)||!DateTime.fromMillis(value.start).isValid||!DateTime.fromMillis(value.end).isValid)throw Error('请填写有效的版本开始时间与结束时间')
 if(value.end<=value.start)throw Error('版本结束时间必须晚于开始时间')
 if(value.autoRenew!==undefined&&typeof value.autoRenew!=='boolean')throw Error('版本周期设置无效')
 return {number:value.number.trim(),start:value.start,end:value.end,...(value.autoRenew!==undefined?{autoRenew:value.autoRenew}:{})}
}
export function renewGameVersion(version:GameVersion,now:number):GameVersion {
 if(!version.autoRenew||now<version.end)return version
 const duration=version.end-version.start,steps=Math.floor((now-version.end)/duration)+1
 const start=version.start+steps*duration,end=version.end+steps*duration
 if(!Number.isSafeInteger(steps)||!Number.isSafeInteger(start)||!Number.isSafeInteger(end)||!DateTime.fromMillis(end).isValid)return version
 const number=version.number.replace(/(\d+)$/,digits=>{const n=BigInt(digits)+BigInt(steps);return n.toString().padStart(digits.length,'0')})
 return {...version,number,start,end}
}
