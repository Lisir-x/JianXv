import React from 'react'

const paths={
 home:'M3 8 9 3l6 5v7H3z M7 15v-4h4v4',
 study:'M9 5C7 4 5 4 3 4v10c2 0 4 0 6 1 2-1 4-1 6-1V4c-2 0-4 0-6 1z M9 5v10 M5 7h2 M11 7h2',
 game:'M5 6h8c1.4 0 2.1 1.4 2.6 3.5l.6 2.7c.3 1.4-.9 2.2-2 1.2l-2.4-2H6.2l-2.4 2c-1.1 1-2.3.2-2-1.2l.6-2.7C2.9 7.4 3.6 6 5 6Z M6 7.8v3 M4.5 9.3h3 M11.5 8.5h.1 M13.5 10h.1',
 settings:'M3 5h12 M3 9h12 M3 13h12 M6 3.5v3 M12 7.5v3 M8 11.5v3',
 exit:'M8 4H4v10h4 M7 9h8 M12 6l3 3-3 3',
}

export function SidebarIcon({name}:{name:keyof typeof paths}){
 return <svg className="sidebar-icon" aria-hidden="true" focusable="false" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"><path d={paths[name]}/></svg>
}
