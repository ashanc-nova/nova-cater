import { tenantConfig } from './tenantConfig'

export const categories = tenantConfig.menu.categories.map(category => category.label)

export const menuItems = tenantConfig.menu.categories.reduce((accumulator, category) => {
  accumulator[category.label] = tenantConfig.menu.itemsByCategoryId[category.id] || []
  return accumulator
}, {})
