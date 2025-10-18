// firebase.js
import admin from "firebase-admin";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

if (!admin.apps.length) {
  const serviceAccountPath = path.join(__dirname, "firebase-service-account.json");
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccountPath),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // e.g. starleyclub.appspot.com
  });
}

const bucket = admin.storage().bucket();

export default bucket;
