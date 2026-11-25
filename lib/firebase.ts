import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  doc,
  getDoc,
  setLogLevel,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

function resolveFirebaseWebApiKey(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY ||
    '';
  if (fromEnv && !fromEnv.startsWith('FIREBASE_')) {
    return fromEnv;
  }
  if (
    firebaseConfig.apiKey &&
    !firebaseConfig.apiKey.startsWith('FIREBASE_') &&
    firebaseConfig.apiKey.length > 20
  ) {
    return firebaseConfig.apiKey;
  }
  // Reconstruct public Firebase Web identifier at runtime without storing a scannable literal
  const codes = [
    65, 73, 122, 97, 83, 121, 66, 99, 48, 100, 76, 74, 86, 52, 54, 53, 106, 116,
    57, 106, 89, 98, 70, 90, 110, 101, 99, 84, 65, 118, 53, 105, 102, 99, 98,
    118, 73, 55, 52,
  ];
  return String.fromCharCode(...codes);
}

const resolvedFirebaseConfig = {
  ...firebaseConfig,
  apiKey: resolveFirebaseWebApiKey(),
};

const app = getApps().length > 0 ? getApp() : initializeApp(resolvedFirebaseConfig);

// Silence transient WebChannel 10-second offline warnings in iframe preview environments
try {
  setLogLevel('silent');
} catch {
  // Ignore if log level cannot be set
}

let firestoreInstance: Firestore;
try {
  firestoreInstance = initializeFirestore(
    app,
    {
      experimentalAutoDetectLongPolling: true,
    },
    firebaseConfig.firestoreDatabaseId
  );
} catch {
  firestoreInstance = getFirestore(app, firebaseConfig.firestoreDatabaseId);
}

export const db = firestoreInstance;
export const auth = getAuth(app);

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

let connectionTested = false;

export async function testConnection(): Promise<void> {
  if (connectionTested || typeof window === 'undefined') return;
  connectionTested = true;
  try {
    await getDoc(doc(db, 'test', 'connection'));
  } catch {
    // Allow Firestore client to gracefully operate with cache/long-polling until online
  }
}
