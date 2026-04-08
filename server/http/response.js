export const sendJson = (res, statusCode, body) => {
  const payload = JSON.stringify(body)
  res.writeHead(statusCode, {
    ...(res._defaultHeaders || {}),
    'content-type': 'application/json; charset=utf-8',
    'content-length': Buffer.byteLength(payload),
  })
  res.end(payload)
}

export const sendNoContent = (res) => {
  res.writeHead(204, {
    ...(res._defaultHeaders || {}),
  })
  res.end()
}
