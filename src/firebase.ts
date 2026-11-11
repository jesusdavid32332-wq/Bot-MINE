import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

// CRITICAL: Must pass firebaseConfig.firestoreDatabaseId as second argument
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

export async function testFirestoreConnection(): Promise<{ connected: boolean; message: string }> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { connected: true, message: 'Conectado exitosamente a Firebase Cloud Firestore' };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn('[Firestore] Test connection notice:', msg);
    // Even if test document does not exist yet, successful network communication without offline error indicates connection
    if (msg.includes('offline') || msg.includes('Failed to get document because the client is offline')) {
      return { connected: false, message: 'Cliente sin conexión a Firestore' };
    }
    return { connected: true, message: 'Conexión activa con Firebase Cloud Firestore' };
  }
}
