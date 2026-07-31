import { createHash, randomBytes } from 'node:crypto';

const secret = `mps_${randomBytes(32).toString('base64url')}`;
const hash = createHash('sha256').update(secret, 'utf8').digest('hex');

console.log(JSON.stringify({
  secret,
  hash,
  hint: secret.slice(-6),
  generatedAt: new Date().toISOString(),
}, null, 2));
