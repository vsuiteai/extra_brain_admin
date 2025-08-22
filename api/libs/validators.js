export const okDept = (d) => ['Onboarding','Support','Admin'].includes(d);
export const okRole = (r) => ['Admin','Manager','Agent','Custom','Client'].includes(r);

export function requireFields(obj, fields) {
  const missing = fields.filter(f => obj[f] === undefined || obj[f] === null || obj[f] === '');
  if (missing.length) {
    const e = new Error(`Missing fields: ${missing.join(', ')}`);
    e.statusCode = 400;
    throw e;
  }
}
