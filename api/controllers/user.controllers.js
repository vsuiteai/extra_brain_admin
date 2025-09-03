import path from 'path';
// import bcrypt from 'bcryptjs';
import { Storage } from "@google-cloud/storage";
import { col } from '../firestore.js';

const storage = new Storage();
const bucket = storage.bucket('vsuite-objects');

const updateProfilePicture = async (req, reply) => {
  const data = await req.file();
  const { userId } = req.params;

  if (!data) {
    return reply.code(400).send({ error: 'No file uploaded' });
  }

  // generate a unique filename
  const ext = path.extname(data.filename);
  const gcsFilename = `profile_pictures/${userId}_${Date.now()}${ext}`;
  const file = bucket.file(gcsFilename);

  // Pipe the file to GCS
  await new Promise((resolve, reject) => {
    const stream = file.createWriteStream({
      resumable: false,
      contentType: data.mimetype,
      metadata: {
        contentType: data.mimetype,
      },
    });

    data.file.pipe(stream)
      .on("finish", resolve)
      .on("error", reject);
  })

  // Get the public URL
  const publicUrl = `https://storage.googleapis.com/${bucket.name}/${gcsFilename}`;

  // Update user profile in Firestore
  await col.users().doc(userId).update({
    avatar: publicUrl,
    updatedAt: new Date().toISOString(),
  })

  return reply.code(200).send({ avatar: publicUrl });
}

const updateProfile = async (req, reply) => {
  const { userId } = req.params;
  const { firstName, lastName, jobTitle, department, email, phoneNumber, timeZone, bio, linkedinUrl, guthubUrl } = req.body;

  if (!firstName || !lastName || !email) {
    return reply.code(400).send({ error: 'Missing required fields' });
  }

  await col.users().doc(userId).update({
    fullName: `${firstName} ${lastName}`,
    jobTitle,
    department,
    bio,
    email,
    phoneNumber,
    timeZone,
    linkedinUrl,
    guthubUrl,
    updatedAt: new Date().toISOString(),
  });

  return reply.code(200).send({ ok: true });
}


export { updateProfilePicture, updateProfile }