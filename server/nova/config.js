export const NOVA_CONFIG = {
  baseUrl: process.env.NOVA_BASE_URL || 'https://uat.integrations.novatabapi.com',
  clientId:
    process.env.NOVA_CLIENT_ID ||
    '7bd67b67fe91b995d5749ed5644b3072e28b4ac256d54d0b',
  clientSecret:
    process.env.NOVA_CLIENT_SECRET ||
    '04885b9e0291a6adf8747dfb054eba95da797386300ca7bcaf0026a6a7c35a21',
  businessRefId:
    process.env.NOVA_BUSINESS_REF_ID || '42d4a7e1-661a-4e72-a822-27112f8e0128',
  applicationName: process.env.NOVA_APPLICATION_NAME || 'TakeAway.App',
  restaurantRefId:
    process.env.NOVA_RESTAURANT_REF_ID || '89e21218-a8c2-46f4-ab92-9746b26ccd4b',
  scope: process.env.NOVA_SCOPE || 'auth:read auth:write',
}
