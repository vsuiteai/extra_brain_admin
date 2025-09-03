import { Firestore } from '@google-cloud/firestore';
import dotenv from 'dotenv';
dotenv.config();

export const db = new Firestore();

export const col = {
  employees:     () => db.collection('employees'),
  roles:         () => db.collection('roles'),
  onboarding:    () => db.collection('onboarding'),
  metricsDaily:  () => db.collection('metrics_daily'),
  audit:         () => db.collection('audit'),
  sessions:      () => db.collection('sessions'),
  clients:       () => db.collection('clients'),
  clientUsers:   () => db.collection('client_users'),
  tickets:       () => db.collection('tickets'),
  users:         () => db.collection('users')
};
