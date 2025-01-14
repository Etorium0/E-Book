import { db } from '../firebase/FirebaseConfig';
import { 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  query, 
  orderByChild, 
  limitToFirst 
} from 'firebase/database';

export const bookService = {
  // Lấy danh sách sách
  async getBooks() {
    try {
      const booksRef = ref(db, 'books');
      const snapshot = await get(booksRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: false, message: 'Không tìm thấy sách' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Thêm sách mới
  async addBook(bookId, bookData) {
    const bookRef = ref(db, `books/${bookId}`);
    try {
      // Thêm timestamp khi tạo sách
      const bookWithTimestamp = {
        ...bookData,
        created_at: Date.now(),
        view: 0,
        rating: 0
      };

      await set(bookRef, bookWithTimestamp);
      return { success: true, message: 'Sách đã được thêm thành công' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Cập nhật thông tin sách
  async updateBook(bookId, updatedData) {
    const bookRef = ref(db, `books/${bookId}`);
    try {
      await update(bookRef, updatedData);
      return { success: true, message: 'Thông tin sách đã được cập nhật' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  // Xóa sách
  async deleteBook(bookId) {
    const bookRef = ref(db, `books/${bookId}`);
    try {
      await remove(bookRef);
      return { success: true, message: 'Sách đã được xóa' };
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async getTrendingBooks(limit = 3) {
    try {
      const booksRef = ref(db, 'books');
      const trendingQuery = query(
        booksRef,
        orderByChild('view')
      );
      
      const snapshot = await get(trendingQuery);
      if (!snapshot.exists()) {
        return [];
      }
      
      const books = [];
      snapshot.forEach((child) => {
        books.push({
          id: child.key,
          ...child.val()
        });
      });
      
      // Sắp xếp theo view giảm dần và lấy số lượng theo limit
      return books
        .sort((a, b) => b.view - a.view)
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching trending books:", error);
      throw error;
    }
  },

  // Lấy sách mới
  async getUpcomingBooks(limit = 3) {
    try {
      const booksRef = ref(db, 'books');
      const newQuery = query(
        booksRef,
        orderByChild('created_at')
      );
      
      const snapshot = await get(newQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const books = [];
      snapshot.forEach((child) => {
        books.push({
          id: child.key,
          ...child.val()
        });
      });
      
      // Sắp xếp theo created_at giảm dần và lấy số lượng theo limit
      return books
        .sort((a, b) => b.created_at - a.created_at)
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching upcoming books:", error);
      throw error;
    }
  },

  // Lấy sách theo rating
  async getTopRatedBooks(limit = 3) {
    try {
      const booksRef = ref(db, 'books');
      const ratedQuery = query(
        booksRef,
        orderByChild('rating')
      );
      
      const snapshot = await get(ratedQuery);
      if (!snapshot.exists()) {
        return [];
      }

      const books = [];
      snapshot.forEach((child) => {
        books.push({
          id: child.key,
          ...child.val()
        });
      });
      
      // Sắp xếp theo rating giảm dần và lấy số lượng theo limit
      return books
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit);
    } catch (error) {
      console.error("Error fetching top rated books:", error);
      throw error;
    }
  }
};
