import React from 'react'

const paths={
 bell:'M18 8a6 6 0 0 0-12 0c0 7-2 7-2 9h16c0-2-2-2-2-9M10 20h4',
 bookmark:'M6 3h12v18l-6-4-6 4z',
 calendarClock:'M3 5h18v14H3z M3 9h18 M7 3v4 M17 3v4 M16 12v3l2 1',
 list:'M4 5h2 M9 5h11 M4 12h2 M9 12h11 M4 19h2 M9 19h11',
 checklist:'M3 5l2 2 3-3 M10 6h11 M3 12l2 2 3-3 M10 13h11 M3 19l2 2 3-3 M10 20h11',
 clock:'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 7v5l3 2 M5 2 2 5 M19 2l3 3',
 calendar:'M3 5h18v16H3z M3 9h18 M7 3v4 M17 3v4',
 sun:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z M12 2v2 M12 20v2 M2 12h2 M20 12h2 M4.9 4.9l1.4 1.4 M17.7 17.7l1.4 1.4 M19.1 4.9l-1.4 1.4 M6.3 17.7l-1.4 1.4',
 weekly:'M3 5h18v16H3z M3 9h18 M7 3v4 M17 3v4 M8 15l2 2 4-4',
 settings:'M4 6h16 M4 12h16 M4 18h16 M8 4v4 M16 10v4 M9 16v4',
 edit:'M4 20h4L19 9l-4-4L4 16z M13 7l4 4',
 plus:'M12 5v14 M5 12h14',
}
export function UiIcon({name}:{name:keyof typeof paths}){
 return <svg className="ui-icon" data-icon={name} aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>
}
