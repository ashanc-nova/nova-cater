const trimSlashes = (value) => value.replace(/^\/+|\/+$/g, '')

const splitPath = (pathname) => {
  const trimmed = trimSlashes(pathname)
  return trimmed ? trimmed.split('/') : []
}

export const matchRoute = (pathname, pattern) => {
  const pathSegments = splitPath(pathname)
  const patternSegments = splitPath(pattern)

  if (pathSegments.length !== patternSegments.length) {
    return null
  }

  const params = {}

  for (let index = 0; index < patternSegments.length; index += 1) {
    const patternSegment = patternSegments[index]
    const pathSegment = pathSegments[index]

    if (patternSegment.startsWith(':')) {
      params[patternSegment.slice(1)] = decodeURIComponent(pathSegment)
      continue
    }

    if (patternSegment !== pathSegment) {
      return null
    }
  }

  return params
}
