import bcrypt from 'bcryptjs';
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';
import { Firestore } from '@google-cloud/firestore';

const firestore = new Firestore();

const login = async (req, reply) => {
  const { email, password } = req.body;

  const userDoc = await firestore.collection('users')
    .where('email', '==', email)
    .where('is_admin', '==', true)
    .limit(1)
    .get();
  if (userDoc.empty) return reply.code(401).send({ error: 'Invalid email or password' });

  const user = userDoc.docs[0].data();
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return reply.code(401).send({ error: 'Invalid email or password' });

  return reply.code(200).send({ ok: true, twoFAEnabled: user.twoFAEnabled });
};

const verifyTwoFAToken = async (req, reply) => {
  const { token, email } = req.body;

  const userDoc = await firestore.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  if (userDoc.empty) return reply.code(401).send({ error: 'Invalid email or password' });

  const user = userDoc.docs[0].data();

  if (user.twoFAEnabled) {
    if (!token) return reply.code(400).send({ error: '2FA token required' });

    const valid2FA = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1,
    });

    if (!valid2FA) return reply.code(401).send({ error: 'Invalid 2FA token' });
  } else {
    return reply.code(401).send({ error: '2FA is not enabled' });
  }

  const { accessToken, refreshToken } = req.server.generateTokens({ id: userDoc.docs[0].id, fullName: user.fullName, email });

  const { password, twoFASecret, twoFAEnabled, ...safeUser } = user;

  return reply
    .setCookie('access_token', accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 15 * 60,
    })
    .setCookie('refresh_token', refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })
    .code(200)
    .send({ ...safeUser, id: userDoc.docs[0].id });
}

const twoFASetup = async (req, reply) => {
  const { email } = req.body;
  if (!email) return reply.code(400).send({ error: 'Email required' });

  const secret = speakeasy.generateSecret({
    name: `Vsuite (${email})`,
    length: 20,
  });

  // Save secret in Firestore (associate with user)
  const userDoc = await firestore.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  await firestore.collection('users').doc(userDoc.docs[0].id).update({ twoFASecret: secret.base32 });

  // Generate QR code for authenticator apps
  const responseUrl = await QRCode.toDataURL(secret.otpauth_url);

  return { qrCodeUrl: responseUrl };
};

const twoFAVerify = async (req, reply) => {
  const { email, token } = req.body;
  if (!email || !token) return reply.code(400).send({ error: 'Email and token required' });

  const userDoc = await firestore.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  if (userDoc.empty) return reply.code(404).send({ error: 'User not found' });

  const { twoFASecret } = userDoc.docs[0].data();

  const verified = speakeasy.totp.verify({
    secret: twoFASecret,
    encoding: 'base32',
    token,
    window: 1, // allow small clock drift
  });

  if (!verified) return reply.code(400).send({ error: 'Invalid token' });

  // Mark 2FA as enabled
  await firestore.collection('users').doc(userDoc.docs[0].id).update({ twoFAEnabled: true });

  return { success: true, message: '2FA enabled successfully' };
};

const refreshTokens = (app) => async (req, reply) => {
  const { refreshToken } = req.body;
  if (!refreshToken) return reply.code(400).send({ error: 'Missing refresh token' });

  try {
    const payload = app.jwt.verify(refreshToken); // verify token validity

    // Check Firestore if refresh token is still valid
    const userDoc = await firestore.collection('users').where('email', '==', payload.email)
    .limit(1)
    .get();
    if (userDoc.empty) return reply.code(401).send({ error: 'Invalid token' });

    const user = userDoc.docs[0].data();

    const { accessToken, refreshToken: newRefreshToken } = req.server.generateTokens({ id: userDoc.docs[0].id, fullName: user.fullName, email: user.email });

    return { id: userDoc.docs[0].id, ...user, accessToken, refreshToken: newRefreshToken };
  } catch (err) {
    console.log(err.message);
    return reply.code(401).send({ error: 'Invalid refresh token' });
  }
};

const signup = async (req, reply) => {
  const { email, password, role, first_name, last_name } = req.body;
  if (!email || !password || !role || !first_name || !last_name) return reply.code(400).send({ error: 'All fields required.' });

  const userDoc = await firestore.collection('users')
    .where('email', '==', email)
    .limit(1)
    .get();
  const existing = userDoc.empty;
  if (existing === false) return reply.code(400).send({ error: 'User already exists' });

  const roleDoc = await firestore.collection('roles').doc(role).get();
  if (!roleDoc.exists) return reply.code(400).send({ error: 'Invalid role' });

  const hash = await bcrypt.hash(password, 10);

  await firestore.collection('users').add({
    email,
    password: hash,
    role: roleDoc.data(),
    is_admin: true,
    first_name,
    last_name,
    createdAt: new Date().toISOString(),
  });

  return { ok: true, message: 'User created successfully' };
};

const me = async (req, reply) => {
  try {
    const decoded = req.user;
    const email = decoded.email;
    if (!email) {
      return reply.code(401).send({ error: 'Invalid token' });
    }
    const userDoc = await firestore.collection('users')
      .where('email', '==', email)
      .limit(1)
      .get();
    if (userDoc.empty) {
      return reply.code(404).send({ error: 'User not found' });
    }
    const user = userDoc.docs[0].data();
    const userId = userDoc.docs[0].id;
    // Don't return password
    // eslint-disable-next-line no-unused-vars
    const { password, ...userInfo } = user;
    return { id: userId, ...userInfo };
  } catch (err) {
    console.log(err.message);
    return reply.code(401).send({ error: 'Invalid or expired token' });
  }
};

export { login, refreshTokens, signup, twoFASetup, twoFAVerify, verifyTwoFAToken, me };