import Fastify from 'fastify';
import cors from '@fastify/cors';
import formbody from '@fastify/formbody';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fs from 'fs';
import yaml from 'yaml';
import dotenv from 'dotenv';
dotenv.config();

import authRoutes from './routes/auth.routes.js';
import employeesRoutes from './routes/employees.js';
import rolesRoutes from './routes/roles.js';
import onboardingRoutes from './routes/onboarding.js';
import metricsRoutes from './routes/metrics.js';
import auditRoutes from './routes/audit.routes.js';
import meRoutes from './routes/me.js';
import clientsRoutes from './routes/clients.js';
import clientUsersRoutes from './routes/clientUsers.js';
import clientPortalRoutes from './routes/clientPortal.js';
import { generateTokens } from './libs/utils.js';

const app = Fastify({ logger: true });
await app.register(cors, { origin: true });
await app.register(formbody);
await app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
app.decorate('generateTokens', (payload) => generateTokens(app, payload));
app.decorate('authenticate', async function (req, reply) {
  try {
    await req.jwtVerify();
  } catch (err) {
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

// 🔹 Load OpenAPI spec
const file = fs.readFileSync('api/openapi.yml', 'utf8');
const openapiSpec = yaml.parse(file);

// 🔹 Register Swagger with your OpenAPI spec
await app.register(swagger, {
  mode: 'static',
  specification: {
    document: openapiSpec,
  },
});

// 🔹 Swagger UI at /docs
await app.register(swaggerUI, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false,
  },
});

app.get('/health', async () => ({ ok:true }));

// await app.register(tenant);
await app.register(authRoutes);
await app.register(employeesRoutes);
await app.register(rolesRoutes);
await app.register(onboardingRoutes);
await app.register(metricsRoutes);
await app.register(auditRoutes);
await app.register(meRoutes);
await app.register(clientsRoutes);
await app.register(clientUsersRoutes);
await app.register(clientPortalRoutes);

const port = process.env.PORT || 8000;
app.listen({ port, host: '0.0.0.0' });
