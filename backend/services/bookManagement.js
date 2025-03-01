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
        const approvedBooks = Object.fromEntries(
          Object.entries(snapshot.val()).filter(([_, book]) => book.status === 'approved')
        );
        return { success: true, data: approvedBooks };
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
        rating: 0,
        totalcomment: 0,
        totalrating: 0,
        status: bookData.status || 'approved' // Default to approved if no status provided
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

  // Lấy sách trending (theo lượt xem)
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
        // Only include approved books
        if (child.val().status !== 'approved') return;
        
        books.push({
          id: child.key,
          name: child.val().name,
          author: child.val().author,
          description: child.val().description,
          image: child.val().image,
          view: child.val().view,
          rating: child.val().rating,
          totalcomment: child.val().totalcomment,
          totalrating: child.val().totalrating,
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

  // Lấy sách mới (theo thời gian tạo)
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
        // Only include approved books
        if (child.val().status !== 'approved') return;
        
        books.push({
          id: child.key,
          name: child.val().name,
          author: child.val().author,
          description: child.val().description,
          image: child.val().image,
          view: child.val().view,
          rating: child.val().rating,
          totalcomment: child.val().totalcomment,
          totalrating: child.val().totalrating,
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
        // Only include approved books
        if (child.val().status !== 'approved') return;
        
        books.push({
          id: child.key,
          name: child.val().name,
          author: child.val().author,
          description: child.val().description,
          image: child.val().image,
          view: child.val().view,
          rating: child.val().rating,
          totalcomment: child.val().totalcomment,
          totalrating: child.val().totalrating,
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
  },

  async getCategoryById(categoryId) {
    try {
      const categoryRef = ref(db, `categories/${categoryId}`);
      const snapshot = await get(categoryRef);

      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: false, message: 'Không tìm thấy thể loại' };
      }
    } catch (error) {
      return { success: false, message: error.message };
    }
  },

  async getAuthorById(authorId) {
    try {
      const authorRef = ref(db, `authors/${authorId}`);
      const snapshot = await get(authorRef);
      
      if (snapshot.exists()) {
        return { success: true, data: snapshot.val() };
      } else {
        return { success: false, message: 'Không tìm thấy tác giả' };
      }
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
  }
};