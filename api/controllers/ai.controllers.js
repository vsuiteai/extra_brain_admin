import { enforceModelPolicy, runGemini, runOpenAI } from '../services/aiProviders.js';
import { buildContext } from '../services/context.js';

function getRole(req) {
  // MVP: accept x-role header ('admin' | 'employee' | 'client'). Integrate real auth later.
  const r = (req.headers['x-role'] || '').toString().toLowerCase();
  return (r === 'admin' || r === 'employee' || r === 'client') ? r : 'employee';
}

const aiQuery = async(req, reply) => {
  const role = getRole(req);
  const { prompt, model, scope, clientIds } = req.body || {};
  if (!prompt) return reply.code(400).send({ error: 'Missing prompt' });

  const ids = Array.isArray(clientIds)
    ? clientIds
    : (req.headers['x-clients'] ? String(req.headers['x-clients']).split(',').map(s=>s.trim()).filter(Boolean) : []);

  const effectiveScope = role === 'admin'
    ? (scope === 'platform' ? 'platform' : 'platform') // admins default to platform
    : 'assigned';

  const ctx = await buildContext({
    scope: effectiveScope,
    clientIds: effectiveScope === 'assigned' ? ids : []
  });

  const policy = enforceModelPolicy(role, model);
  let text = '';
  if (policy.provider === 'gemini') {
    text = await runGemini({ model: policy.model, prompt, context: ctx });
  } else {
    text = await runOpenAI({ model: policy.model, prompt, context: ctx });
  }

  return { role, scope: effectiveScope, provider: policy.provider, model: policy.model, text };
};

const clientQuery = async (req, reply) => {
  const clientId = req.tenant?.clientId || req.headers['x-client-id'];
  if (!clientId) return reply.code(400).send({ error: 'Missing clientId (x-client-id)' });
  const { prompt } = req.body || {};
  if (!prompt) return reply.code(400).send({ error: 'Missing prompt' });

  const ctx = await buildContext({ scope: 'client', clientIds: [String(clientId)] });
  const text = await runGemini({ model: 'gemini-1.5-flash', prompt, context: ctx });
  return { role: 'client', scope: 'client', clientId: String(clientId), provider: 'gemini', model: 'gemini-1.5-flash', text };
};

export { aiQuery, clientQuery };