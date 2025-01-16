import { db, auth } from '../firebase/FirebaseConfig';
import { ref, set, update, get, remove } from 'firebase/database';

export const readingService = {
  // Thêm sách vào trạng thái đang đọc
  async addToReading(bookId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Người dùng chưa đăng nhập');

      // Tạo progressId không có dấu underscore
      const progressId = `${userId}B${bookId}`; // Sử dụng 'B' làm separator thay vì underscore
      
      // Tạo hoặc cập nhật reading progress
      const progressRef = ref(db, `reading_progress/${progressId}`);
      const now = new Date().toISOString();
      
      // Kiểm tra xem đã có progress chưa
      const progressSnapshot = await get(progressRef);
      if (!progressSnapshot.exists()) {
        // Tạo mới nếu chưa có
        await set(progressRef, {
          userId: userId,
          bookId: bookId,
          progress: 0,
          lastread: now,
          updatedat: now,
          currentChapter: 1,
          completed: false
        });
      } else {
        // Cập nhật thời gian đọc nếu đã có
        await update(progressRef, {
          lastread: now,
          updatedat: now
        });
      }

      // Thêm vào danh sách đang đọc của user
      const userReadingRef = ref(db, `users/${userId}/reading/${bookId}`);
      await set(userReadingRef, {
        addedAt: now,
        lastRead: now
      });

      // Cập nhật lastRead trong thông tin sách
      const bookRef = ref(db, `books/${bookId}`);
      await update(bookRef, {
        lastRead: now
      });

      // Xóa khỏi danh sách muốn đọc nếu có
      const toReadingRef = ref(db, `users/${userId}/toreading/${bookId}`);
      await remove(toReadingRef);

      return { success: true, message: 'Đã thêm sách vào danh sách đang đọc' };
    } catch (error) {
      console.error('Error adding book to reading:', error);
      return { success: false, message: error.message };
    }
  },

  // Cập nhật tiến độ đọc
  async updateReadingProgress(bookId, progress, currentChapter) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Người dùng chưa đăng nhập');

      const progressId = `${userId}B${bookId}`;
      const progressRef = ref(db, `reading_progress/${progressId}`);
      const userReadingRef = ref(db, `users/${userId}/reading/${bookId}`);
      const now = new Date().toISOString();

      await Promise.all([
        update(progressRef, {
          progress: progress,
          currentChapter: currentChapter,
          lastread: now,
          updatedat: now
        }),
        update(userReadingRef, {
          lastRead: now
        })
      ]);

      return { success: true, message: 'Đã cập nhật tiến độ đọc' };
    } catch (error) {
      console.error('Error updating reading progress:', error);
      return { success: false, message: error.message };
    }
  },

  // Chuyển sách sang trạng thái đã đọc xong
  async markAsFinished(bookId) {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) throw new Error('Người dùng chưa đăng nhập');

      const now = new Date().toISOString();
      const progressId = `${userId}B${bookId}`;

      // Cập nhật progress thành 100%
      const progressRef = ref(db, `reading_progress/${progressId}`);
      await update(progressRef, {
        progress: 100,
        lastread: now,
        updatedat: now,
        completed: true
      });

      // Xóa khỏi danh sách đang đọc
      const readingRef = ref(db, `users/${userId}/reading/${bookId}`);
      await remove(readingRef);

      // Thêm vào danh sách đã đọc xong
      const finishedRef = ref(db, `users/${userId}/finished/${bookId}`);
      await set(finishedRef, {
        finishedAt: now,
        lastRead: now
      });

      return { success: true, message: 'Đã đánh dấu sách là đã đọc xong' };
    } catch (error) {
      console.error('Error marking book as finished:', error);
      return { success: false, message: error.message };
    }
  }
};