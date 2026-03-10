export function getRequiredEnv(name: string, logPrefix: string): string | null {
  const value = process.env[name]?.trim()

  if (!value) {
    console.error(`[${logPrefix}] ${name} is not set`)
    return null
  }

  return value
}

export function getAppUrl(request?: Request): string {
  const vercelUrl = process.env.VERCEL_URL?.trim()
  if (vercelUrl) {
    return `https://${vercelUrl}`
  }

  if (request) {
    const forwardedHost =
      request.headers.get('x-forwarded-host')?.trim() ??
      request.headers.get('host')?.trim()
    const forwardedProto = request.headers.get('x-forwarded-proto')?.trim()

    if (forwardedHost) {
      const protocol = forwardedProto ?? (forwardedHost.includes('localhost') ? 'http' : 'https')
      return `${protocol}://${forwardedHost}`
    }

    const url = new URL(request.url)
    if (url.host) {
      return `${url.protocol}//${url.host}`
    }
  }

  return 'http://localhost:3000'
}
