import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// Firebase 서비스 인스턴스 export
export { auth, firestore, storage };

// 컬렉션 참조
export const collections = {
  USERS: 'users',
  POSTS: 'posts',
} as const;

// 스토리지 경로
export const storagePaths = {
  POST_IMAGES: 'posts/images',
  PROFILE_IMAGES: 'users/profiles',
} as const;

// Firebase 초기화 확인
export const checkFirebaseConnection = (): boolean => {
  try {
    // Firebase 앱이 초기화되었는지 확인
    return auth().app.options.appId !== undefined;
  } catch (error) {
    console.error('Firebase connection error:', error);
    return false;
  }
};
