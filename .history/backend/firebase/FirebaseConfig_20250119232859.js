import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, getAuth as firebaseGetAuth, initializeAuth, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getDatabase, ref, get, set, update, remove } from 'firebase/database';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';

// Firebase config cho ứng dụng React Native
const firebaseConfig = {
  apiKey: "AIzaSyALpnD1mYK7VuaFmuEDstaYHw8pzuHdZ7Y",
  authDomain: "e-book-ccea4.firebaseapp.com",
  databaseURL: "https://e-book-ccea4-default-rtdb.firebaseio.com",
  projectId: "e-book-ccea4",
  storageBucket: "e-book-ccea4.firebasestorage.app",  // Đảm bảo đúng URL này
  messagingSenderId: "537469765673",
  appId: "1:537469765673:web:115c2137faa23463323438",
  measurementId: "G-6HF712MFV0",
};

// Khởi tạo ứng dụng Firebase
const app = initializeApp(firebaseConfig);

// Kiểm tra xem Firebase Auth đã được khởi tạo chưa
let auth;
if (firebaseGetAuth(app)) {
  auth = firebaseGetAuth(app); // Nếu đã khởi tạo, sử dụng đối tượng auth hiện tại
} else {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage),
  }); // Nếu chưa, khởi tạo Auth
}

const firestore = getFirestore(app);
const storage = getStorage(app);
const database = getDatabase(app);

// Export tất cả các đối tượng và phương thức liên quan đến Firebase
export { 
  auth, 
  signInWithEmailAndPassword, 
  firestore, 
  storage, 
  database, 
  ref, 
  get, 
  set, 
  update, 
  remove 
};
