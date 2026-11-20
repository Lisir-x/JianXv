import React from 'react'
import type {Kind,Snapshot} from '../shared/types'

const states=[['pending','待完成'],['overdue','已超期'],['done','已完成'],['all','全部']] as const
const kinds:Kind[]=['study','game']
export function HomeStats({counts,moduleCounts}:Pick<Snapshot,'counts'|'moduleCounts'>){
 const rate=counts.all?Math.round(counts.done/counts.all*100):0
 return <section className="home-stats" aria-label="总览">
  <h2>总览</h2>
  <div className="home-stats-grid">{states.map(([status,label])=><div key={status} className={'overview-count '+status}><span>{label}</span><strong>{counts[status]}</strong></div>)}</div>
  <div className="overview-progress"><span>完成率</span><strong>{rate}%</strong><progress max={100} value={rate} aria-label="完成率"/></div>
  <table className="overview-breakdown" aria-label="模块统计"><thead><tr><th scope="col">模块</th>{states.slice(0,3).map(([status,label])=><th key={status} scope="col">{label}</th>)}</tr></thead>
   <tbody>{kinds.map(kind=><tr key={kind}><th scope="row">{kind==='study'?'学习':'游戏'}</th>{states.slice(0,3).map(([status])=><td key={status}>{moduleCounts[kind][status]}</td>)}</tr>)}</tbody>
  </table>
 </section>
}
