import { col } from "../firestore.js";

// Get all companies (paginated, last document style)
export async function getCompanies(request, reply) {
  const { limit = 20, lastDoc } = request.query;
  let query = col.companies().orderBy('CompanyID').limit(Number(limit));
  if (lastDoc) {
    const last = await col.companies().doc(lastDoc).get();
    if (last.exists) {
      query = query.startAfter(last);
    }
  }
  const snap = await query.get();
  const companies = [];
  snap.forEach(doc => companies.push(doc.data()));
  const lastVisible = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;
  reply.send({ companies, lastDoc: lastVisible });
}

// Get a single company
export async function getCompany(request, reply) {
  const { id } = request.params;
  const doc = await col.companies().doc(id).get();
  if (!doc.exists) return reply.status(404).send({ error: "Not found" });
  reply.send(doc.data());
}

// Create a company
export async function createCompany(request, reply) {
  const data = request.body;
  if (!data.CompanyID) return reply.status(400).send({ error: "CompanyID required" });
  await col.companies().doc(data.CompanyID).set(data);
  reply.status(201).send({ success: true });
}

// Update a company
export async function updateCompany(request, reply) {
  const { id } = request.params;
  const data = request.body;
  await col.companies().doc(id).update(data);
  reply.send({ success: true });
}

// Delete a company
export async function deleteCompany(request, reply) {
  const { id } = request.params;
  await col.companies().doc(id).delete();
  reply.send({ success: true });
}
