import type {Page} from '@playwright/test'
export async function groupMenu(page:Page,name:string,action:string){await page.locator('nav').getByRole('button',{name:'管理 '+name,exact:true}).click();await page.getByRole('menu',{name:name+'管理菜单',exact:true}).getByRole('menuitem',{name:action,exact:true}).click()}
