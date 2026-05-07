import { createHmac, randomUUID, timingSafeEqual } from 'crypto'

const DEFAULT_TTL_SECONDS = 900

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function parseBase64urlJSON(value) {
  try {
    const json = Buffer.from(value, 'base64url').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function tokenSecret() {
  return process.env.AURUM_TOKEN_SECRET ?? ''
}

function sign(body) {
  if (!tokenSecret()) {
    throw new Error('missing_token_secret')
  }
  return createHmac('sha256', tokenSecret()).update(body).digest('base64url')
}

export function mintAccessToken({
  agentId,
  keyId,
  address,
  status,
  audience = 'default',
  scope = 'identity:read',
  ttlSeconds = DEFAULT_TTL_SECONDS,
}) {
  const now = Math.floor(Date.now() / 1000)
  const ttl = Math.max(60, Math.min(Number(ttlSeconds) || DEFAULT_TTL_SECONDS, 3600))
  const payload = {
    iss: 'aurum',
    sub: agentId,
    key_id: keyId,
    address,
    status,
    aud: audience,
    scope,
    iat: now,
    exp: now + ttl,
    jti: randomUUID(),
  }
  const encodedPayload = base64url(JSON.stringify(payload))
  const signature = sign(encodedPayload)
  return {
    accessToken: `at_${encodedPayload}.${signature}`,
    expiresIn: ttl,
  }
}

export function verifyAccessToken(token) {
  if (!tokenSecret()) {
    return { ok: false, error: 'server_misconfigured' }
  }

  if (!token || !token.startsWith('at_')) {
    return { ok: false, error: 'invalid_token' }
  }

  const raw = token.slice(3)
  const [encodedPayload, providedSig] = raw.split('.')
  if (!encodedPayload || !providedSig) {
    return { ok: false, error: 'invalid_token' }
  }

  const expectedSig = sign(encodedPayload)
  const expectedBuf = Buffer.from(expectedSig)
  const providedBuf = Buffer.from(providedSig)
  if (expectedBuf.length !== providedBuf.length || !timingSafeEqual(expectedBuf, providedBuf)) {
    return { ok: false, error: 'invalid_token' }
  }

  const payload = parseBase64urlJSON(encodedPayload)
  if (!payload?.sub || !payload?.key_id || !payload?.exp) {
    return { ok: false, error: 'invalid_token' }
  }

  const now = Math.floor(Date.now() / 1000)
  if (payload.exp <= now) {
    return { ok: false, error: 'expired_token', payload }
  }

  return { ok: true, payload }
}
