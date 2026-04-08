import { createCateringServer } from './app.js'

const port = Number(process.env.PORT || 3001)
const { server } = createCateringServer()

server.listen(port, () => {
  console.log(`catering-service listening on http://localhost:${port}`)
})
