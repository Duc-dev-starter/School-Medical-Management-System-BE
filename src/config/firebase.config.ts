import * as admin from 'firebase-admin';
import { ConfigService } from '@nestjs/config';

export const initializeFirebaseAdmin = (configService: ConfigService) => {
  const firebaseConfig = configService.get<string>('FIREBASE_CONFIG');
  
  if (!firebaseConfig) {
    throw new Error('FIREBASE_CONFIG is not defined in the environment variables');
  }

  try {
    const parsedConfig = JSON.parse(firebaseConfig);
    if (admin.apps.length === 0) {
      admin.initializeApp({
        credential: admin.credential.cert(parsedConfig),
      });
    }
  } catch (error) {
    throw new Error('Failed to parse FIREBASE_CONFIG: ' + error.message);
  }
};
