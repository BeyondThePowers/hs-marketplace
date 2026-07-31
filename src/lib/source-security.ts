import { timingSafeEqual } from 'node:crypto';
import { secretHash } from './content-hash';

export function bearerToken(authorization: string | undefined) {
  if (!authorization?.startsWith('Bearer ')) return null;
  const token = authorization.slice('Bearer '.length).trim();
  return token || null;
}

export function verifySecret(secret: string, expectedHash: string) {
  const actual = Buffer.from(secretHash(secret), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function isPrivateIpv4(hostname: string) {
  const octets = hostname.split('.').map(Number);
  if (octets.length !== 4 || octets.some((value) => !Number.isInteger(value))) return false;
  return (
    octets[0] === 10 ||
    octets[0] === 127 ||
    (octets[0] === 169 && octets[1] === 254) ||
    (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
    (octets[0] === 192 && octets[1] === 168)
  );
}

export function assertSafeFeedUrl(value: string) {
  const url = new URL(value);
  const allowInsecure = process.env.ALLOW_INSECURE_SOURCE_URLS === '1';

  if (!allowInsecure && url.protocol !== 'https:') {
    throw new Error('Registered source feeds must use HTTPS');
  }
  if (
    !allowInsecure &&
    (url.hostname === 'localhost' ||
      url.hostname === '::1' ||
      url.hostname.endsWith('.local') ||
      isPrivateIpv4(url.hostname))
  ) {
    throw new Error('Registered source feed hostname is not publicly routable');
  }
  if (url.username || url.password) {
    throw new Error('Registered source feed URL must not contain credentials');
  }
  return url;
}
