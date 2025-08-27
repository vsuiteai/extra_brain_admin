import { col } from '../firestore.js';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';

const client = new SecretManagerServiceClient();

export async function getSecret(name) {
  const [version] = await client.accessSecretVersion({
    name,
  });

  const payload = version.payload.data.toString('utf8');
  return payload;
}


export async function audit({ actor='system', action, target, details }) {
  const now = new Date().toISOString();
  await col.audit().add({ when: now, who: actor, action, target, details: details || {} });
}

export function parseQuery(req, map = {}) {
  const q = {};
  for (const [k, type] of Object.entries(map)) {
    const v = req.query?.[k];
    if (v === undefined) continue;
    q[k] = (type === 'number') ? Number(v) : String(v);
  }
  return q;
}

// Utility to generate tokens
export function generateTokens(app, payload) {
  const accessToken = app.jwt.sign(payload, { expiresIn: '15m' });
  const refreshToken = app.jwt.sign(payload, { expiresIn: '7d' });
  return { accessToken, refreshToken };
}
