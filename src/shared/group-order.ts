import type {Group} from './types'
export function orderedGroups(groups:Group[]){return [...groups].sort((a,b)=>Number(b.pinnedAt!==undefined&&b.pinnedAt!==null)-Number(a.pinnedAt!==undefined&&a.pinnedAt!==null)||(b.pinnedAt??0)-(a.pinnedAt??0)||a.createdAt-b.createdAt)}
