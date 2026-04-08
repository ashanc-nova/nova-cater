import { createServer } from 'node:http'
import { createCateringController } from './catering/controller.js'
import { seedData } from './catering/seed.js'
import { CateringService } from './catering/service.js'
import { InMemoryCateringStore } from './catering/store.js'
import { AuthRegistry } from './nova/authRegistry.js'
import { NovaApiClient } from './nova/client.js'

export const createCateringRuntime = () => {
  const repository = new InMemoryCateringStore(seedData)
  const service = new CateringService(repository)
  const authRegistry = new AuthRegistry()
  const novaClient = new NovaApiClient()

  return {
    repository,
    service,
    authRegistry,
    novaClient,
  }
}

export const createCateringServer = (runtime = createCateringRuntime()) => {
  const handler = createCateringController(runtime)
  const server = createServer(handler)

  return {
    server,
    runtime,
  }
}
