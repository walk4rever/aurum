import { randomBytes, createHash } from 'crypto'

export function generateApiKey() {
  return 'aur_' + randomBytes(32).toString('base64url')
}

export function hashApiKey(key) {
  return createHash('sha256').update(key).digest('hex')
}
