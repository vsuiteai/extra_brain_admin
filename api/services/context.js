// Collects Firestore snippets for the right scope
import { col } from "../firestore.js";

export async function buildContext({ scope, clientIds = [] }) {
  // scope: "platform" | "assigned" | "client"
  let parts = [];

  // Basic KPIs for admins
  if (scope === "platform") {
    const today = new Date().toISOString().slice(0,10);
    const kpiDoc = await col.metricsDaily().doc(today).get();
    if (kpiDoc.exists) parts.push(`# Platform KPIs\n${JSON.stringify(kpiDoc.data())}`);
  }

  // Per-client onboarding & tickets
  const targets = (scope === "client") ? clientIds : (scope === "assigned" ? clientIds : []);
  if (targets.length) {
    for (const cid of targets) {
      const ob = await col.onboarding().where("clientId","==",cid).limit(25).get();
      const tk = await col.tickets().where("clientId","==",cid).limit(25).get();
      parts.push(`# Client ${cid} Onboarding\n${JSON.stringify(ob.docs.map(d=>d.data()))}`);
      parts.push(`# Client ${cid} Tickets\n${JSON.stringify(tk.docs.map(d=>d.data()))}`);
    }
  }

  // If single-client scope without stored IDs, still include generic recent onboarding/tickets
  if (!parts.length && scope !== "platform") {
    const ob = await col.onboarding().limit(10).get();
    const tk = await col.tickets().limit(10).get();
    parts.push(`# Recent Onboarding (generic)\n${JSON.stringify(ob.docs.map(d=>d.data()))}`);
    parts.push(`# Recent Tickets (generic)\n${JSON.stringify(tk.docs.map(d=>d.data()))}`);
  }

  return parts.join("\n\n");
}