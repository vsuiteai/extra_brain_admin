import { col } from '../firestore.js';

const getClients = async (req, reply) => {
    const { limit = 20, lastDoc } = req.query;
    let query = col.users().where('roleName', '==', 'Client');

    if (lastDoc) {
        const last = await col.users().doc(lastDoc).get();
        if (last.exists) {
            query = query.startAfter(last);
        }
    }

    const snap = await query.limit(limit).get();
    const clients = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    const lastVisible = snap.docs.length ? snap.docs[snap.docs.length - 1].id : null;

    return reply.send({
        clients,
        lastDoc: lastVisible,
    })
}

const getClientProfile = async (req, reply) => {
    const { id } = req.params;

    const clientDoc = await col.users().doc(id).get();
    if (!clientDoc.exists) return reply.code(404).send({ error: 'Client not found' });

    return reply.send({ id: clientDoc.id, ...clientDoc.data() } );
}

export { getClients, getClientProfile };