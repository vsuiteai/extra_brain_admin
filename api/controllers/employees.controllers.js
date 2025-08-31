import { col } from '../firestore.js';

const getEmployees = async (req, reply) => {
  const { dept, status, role, searchString, lastDateJoined, limit } = req.query || {};

  let query = col.employees();
  if (dept) {
    query = query.where('department', '==', dept);
  }
  if (status) {
    query = query.where('status', '==', status);
  }
  if (role) {
    query = query.where('role', '==', role);
  }
  if (searchString) {
    query = query.where('name', '>=', searchString).where('name', '<=', searchString + '\uf8ff');
  }

  const employees = query.orderBy('dateJoined', 'desc').limit(limit || 10);

  if (lastDateJoined) {
    query = query.startAfter(lastDateJoined);
  }

  const snapshot = await employees.get();

  const snapshotCount = await employees.count().get();

  reply.send({ total: snapshotCount.data().count, data: snapshot.docs.map(doc => doc.data()) });
}

const inviteEmployee = async (req, reply) => {
  const { name, email, phone, dept, role, notes } = req.params || {};

  if (!email || !name || !dept || !role) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }

  const userDoc = await col.employees()
    .where('email', '==', email)
    .limit(1)
    .get();

  if (!userDoc.empty) {
    return reply.code(400).send({ error: 'Email already in use'})
  }

  const newUser = {
    email,
    name,
    phone: phone || null,
    dept,
    role,
    active: false,
    notes: notes || null,
    dateJoined: new Date().toISOString(),
  }

  const newDoc = await col.employees().add(newUser);

  // Generate a unique invitation link (you may want to use a proper token generation system)
  const inviteLink = `${process.env.BASE_URL}/api/employees/${newDoc.id}/accept-invite`;

  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL,
    subject: 'Welcome to vSuite - Your Invitation Inside',
    text: `You've been invited to join vSuite. Please click this link to accept your invitation: ${inviteLink}`,
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to vSuite</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f6f9fc; font-family: Arial, sans-serif;">
          <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <tr>
              <td style="background-color: #ffffff; padding: 40px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <table border="0" cellpadding="0" cellspacing="0" width="100%">
                  <tr>
                    <td align="center">
                      <img src="https://storage.googleapis.com/vsuite-objects/Logo.svg" alt="vSuite Logo" style="margin-bottom: 20px; max-width: 150px;">
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <h1 style="color: #333333; font-size: 24px; margin-bottom: 20px; text-align: center;">Welcome to vSuite!</h1>
                      <p style="color: #666666; font-size: 16px; line-height: 24px; margin-bottom: 20px;">
                        Hello ${name}, you've been invited to join vSuite as a ${role} in the ${dept} department. We're excited to have you on board!
                      </p>
                      <div style="background-color: #f8fafc; border-radius: 4px; padding: 20px; margin: 20px 0;">
                        <h2 style="color: #333333; font-size: 18px; margin: 0 0 15px 0;">Account Setup Instructions:</h2>
                        <ol style="color: #666666; font-size: 16px; line-height: 24px; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 10px;">Click the "Accept Invitation" button below</li>
                          <li style="margin-bottom: 10px;">Create your password and complete your profile</li>
                          <li style="margin-bottom: 10px;">Review and accept our terms of service</li>
                          <li style="margin-bottom: 0;">Start using vSuite!</li>
                        </ol>
                      </div>
                      <table border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <td align="center">
                            <a href="${inviteLink}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 4px; font-weight: bold;">Accept Invitation</a>
                          </td>
                        </tr>
                      </table>
                      <p style="color: #666666; font-size: 14px; line-height: 24px; margin-top: 30px;">
                        If you're having trouble clicking the button, copy and paste this URL into your web browser:<br>
                        <a href="${inviteLink}" style="color: #4f46e5; text-decoration: none;">${inviteLink}</a>
                      </p>
                      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
                        <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0 0 10px 0;">
                          <strong>Security Note:</strong> For your protection, this invitation link will expire in 7 days.
                        </p>
                        <p style="color: #666666; font-size: 14px; line-height: 20px; margin: 0;">
                          If you have any issues setting up your account, please contact our support team at ${process.env.SUPPORT_EMAIL || 'support@vsuite.ai'}.
                        </p>
                      </div>
                      <p style="color: #999999; font-size: 14px; line-height: 24px; margin-top: 30px; text-align: center;">
                        If you didn't expect to receive this invitation, you can safely ignore this email.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  try {
    await req.server.sgMail.send(msg);
    reply.send({ ok: true, message: 'Invitation sent' });
  } catch (error) {
    console.error('Error sending email:', error);
    reply.code(500).send({ error: 'Failed to send invitation' });
  }
}

const acceptInvite = async (req, reply) => {
  const { id } = req.params;

  const employeeDoc = await col.employees().doc(id).get();
  if (!employeeDoc.exists) return reply.code(404).send({ error: 'Employee not found' });

  await col.employees().doc(id).update({
    active: true,
  });

  reply.redirect(`${process.env.FRONTEND_URL}`, 302);
}

const updateEmployee = async (req, reply) => {
  const { id } = req.params;
  const { name, email, dept, role, phone, active, notes } = req.body;

  if (!name || !email || !dept || !role) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }

  const employeeDoc = await col.employees().doc(id).get();
  if (!employeeDoc.exists) return reply.code(404).send({ error: 'Employee not found' });

  await col.employees().doc(id).update({
    name,
    email,
    dept,
    role,
    phone: phone || null,
    active: !!active,
    notes,
  });

  reply.send({ ok: true });
};

const getSingleEmployee = async (req, reply) => {
  const { id } = req.params;

  const employeeDoc = await col.employees().doc(id).get();
  if (!employeeDoc.exists) return reply.code(404).send({ error: 'Employee not found' });

  reply.send({ id: employeeDoc.id, ...employeeDoc.data() });
}

export { getEmployees, inviteEmployee, acceptInvite, updateEmployee, getSingleEmployee };