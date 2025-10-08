import 'dotenv/config';
import Fastify from 'fastify';
import cors from '@fastify/cors';
import fastifyCookie from '@fastify/cookie'
import formbody from '@fastify/formbody';
import fastifyMultipart from '@fastify/multipart';
import jwt from '@fastify/jwt';
import swagger from '@fastify/swagger';
import swaggerUI from '@fastify/swagger-ui';
import fs from 'fs';
import yaml from 'yaml';
import sgMail from '@sendgrid/mail';

import authRoutes from './routes/auth.routes.js';
import companyRoutes from './routes/companies.routes.js';
import aiRoutes from './routes/ai.routes.js';
import userRoutes from './routes/user.routes.js';
import financialAnalysisRoutes from './routes/financialAnalysis.routes.js';
import employeesRoutes from './routes/employees.routes.js';
import rolesRoutes from './routes/roles.routes.js';
import onboardingRoutes from './routes/onboarding.js';
import metricsRoutes from './routes/metrics.js';
import auditRoutes from './routes/audit.routes.js';
import meRoutes from './routes/me.js';
import clientsRoutes from './routes/client.routes.js';
import clientPortalRoutes from './routes/clientPortal.js';
import { generateTokens } from './libs/utils.js';

const app = Fastify({ logger: true });
await app.register(cors, {
  origin: true,
  credentials: true,
  methods: '*'
});
await app.register(formbody);
await app.register(fastifyMultipart);
await app.register(fastifyCookie, {
  secret: process.env.COOKIE_SECRET,
  hook: 'onRequest',
  domain: '.vsuite.ai'
});
await app.register(jwt, { secret: process.env.JWT_SECRET || 'supersecret' });
app.decorate('generateTokens', (payload) => generateTokens(app, payload));
app.decorate('authenticate', async function (req, reply) {
  try {
    let token;

    if (req.cookies?.access_token) {
      token = req.cookies.access_token;
    }

    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return reply.code(401).send({ error: 'No token provided' });
    }

    const decoded = await req.server.jwt.verify(token);
    req.user = decoded;
  } catch (err) {
    console.error('Authentication error:', err);
    reply.code(401).send({ error: 'Unauthorized' });
  }
});

sgMail.setApiKey(process.env.SENDGRID_API_KEY);
app.decorate('sgMail', sgMail);

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
await app.register(aiRoutes);
await app.register(financialAnalysisRoutes);
await app.register(employeesRoutes);
await app.register(rolesRoutes);
await app.register(onboardingRoutes);
await app.register(metricsRoutes);
await app.register(auditRoutes);
await app.register(meRoutes);
await app.register(clientsRoutes);
await app.register(clientPortalRoutes);
await app.register(companyRoutes);
await app.register(userRoutes);

const port = process.env.PORT || 8080;
app.listen({ port, host: '0.0.0.0' });
