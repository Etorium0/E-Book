import { db } from '../firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';

export const libraryService = {
  // Lấy danh sách sách đang đọc
  async getReadingBooks(userId) {
    try {
      const userRef = ref(db, `users/${userId}/toreading`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (error) {
      console.error("Error getting reading books:", error);
      return 0;
    }
  },

  // Lấy danh sách sách muốn đọc
  async getWantToReadBooks(userId) {
    try {
      const userRef = ref(db, `users/${userId}/toreading`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (error) {
      console.error("Error getting want to read books:", error);
      return 0;
    }
  },

  // Lấy danh sách sách đã đọc xong
  async getFinishedBooks(userId) {
    try {
      const userRef = ref(db, `users/${userId}/finished`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (error) {
      console.error("Error getting finished books:", error);
      return 0;
    }
  },

  // Lấy danh sách sách yêu thích
  async getFavoriteBooks(userId) {
    try {
      const userRef = ref(db, `users/${userId}/favorites`);
      const snapshot = await get(userRef);
      if (snapshot.exists()) {
        return Object.keys(snapshot.val()).length;
      }
      return 0;
    } catch (error) {
      console.error("Error getting favorite books:", error);
      return 0;
    }
  }
};