import { HttpError } from './errors.js'

const MAX_BODY_SIZE = 1024 * 1024

export const readJsonBody = async (req) => {
  const method = req.method || 'GET'
  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
    return null
  }

  const chunks = []
  let size = 0

  for await (const chunk of req) {
    const bufferChunk = Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk))
    size += bufferChunk.length
    if (size > MAX_BODY_SIZE) {
      throw new HttpError(413, 'Request body too large')
    }
    chunks.push(bufferChunk)
  }

  if (chunks.length === 0) {
    return null
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim()
  if (!raw) {
    return null
  }

  try {
    return JSON.parse(raw)
  } catch {
    throw new HttpError(400, 'Invalid JSON request body')
  }
}
