import { database, storage, auth } from '../firebase/FirebaseConfig';
import { ref, push, set, get, update, remove } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';

// Hàm lấy ID mới cho book
async function getNextBookId() {
  const booksRef = ref(database, 'books');
  const snapshot = await get(booksRef);
  let maxId = 0;
  
  snapshot.forEach((child) => {
    const id = child.key;
    if (id.startsWith('bookId')) {
      const num = parseInt(id.replace('bookId', ''));
      if (num > maxId) maxId = num;
    }
  });
  
  return `bookId${maxId + 1}`;
}

// Hàm lấy ID mới cho chapter
async function getNextChapterId(bookId) {
  const chaptersRef = ref(database, `books/${bookId}/chapters`);
  const snapshot = await get(chaptersRef);
  if (!snapshot.exists()) return 'chapterId01';
  
  let maxId = 0;
  snapshot.forEach((child) => {
    const id = child.key;
    if (id.startsWith('chapterId')) {
      const num = parseInt(id.replace('chapterId', ''));
      if (num > maxId) maxId = num;
    }
  });
  
  return `chapterId${String(maxId + 1).padStart(2, '0')}`;
}

// Tạo truyện mới
export const createNewStory = async (storyData, coverImage) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Tạo ID mới cho book
    const bookId = await getNextBookId();

    // Upload ảnh bìa
    let coverImageUrl = '';
    if (coverImage) {
      const imageRef = storageRef(storage, `image/${bookId}.jpg`);
      const response = await fetch(coverImage);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      coverImageUrl = await getDownloadURL(imageRef);
    }

    // Upload description
    const descRef = storageRef(storage, `description/${bookId}.txt`);
    const descBlob = new Blob([storyData.description], {type: 'text/plain;charset=UTF-8'});
    await uploadBytes(descRef, descBlob);
    const descUrl = await getDownloadURL(descRef);

    // Tạo chapter đầu tiên
    const chapterId = 'chapterId01';
    const chapterContentRef = storageRef(storage, `content/${bookId}/${chapterId}.txt`);
    const chapterBlob = new Blob([''], {type: 'text/plain;charset=UTF-8'});
    await uploadBytes(chapterContentRef, chapterBlob);
    const contentUrl = await getDownloadURL(chapterContentRef);

    // Tạo book data
    const bookData = {
      name: storyData.title,
      description: descUrl,
      image: coverImageUrl,
      user_id: user.uid,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
      status: 'approved',
      view: 0,
      downloads: 0,
      rating: 0,
      totalrating: 0,
      totalcomment: 0,
      favoriteCount: 0,
      categories: {},
      authors: {
        [user.uid]: true
      },
      chapters: {
        [chapterId]: {
          content: contentUrl,
          createdat: new Date().toISOString(),
          name: "Chương 1",
          orderindex: 1,
          updatedat: new Date().toISOString(),
          view: 0
        }
      }
    };

    // Lưu vào database
    await set(ref(database, `books/${bookId}`), bookData);
    return bookId;

  } catch (error) {
    console.error('Lỗi khi tạo truyện:', error);
    throw error;
  }
};

// Thêm chapter mới
export const addChapter = async (bookId, chapterData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');
    
    // Lấy ID mới cho chapter
    const chapterId = await getNextChapterId(bookId);
    
    // Upload nội dung chapter
    const contentRef = storageRef(storage, `content/${bookId}/${chapterId}.txt`);
    const contentBlob = new Blob([chapterData.content], {type: 'text/plain;charset=UTF-8'});
    await uploadBytes(contentRef, contentBlob);
    const contentUrl = await getDownloadURL(contentRef);

    // Tạo chapter data
    const newChapter = {
      content: contentUrl,
      createdat: new Date().toISOString(),
      name: chapterData.title,
      orderindex: await getNextOrderIndex(bookId),
      updatedat: new Date().toISOString(),
      view: 0
    };

    // Cập nhật database
    await set(ref(database, `books/${bookId}/chapters/${chapterId}`), newChapter);
    await update(ref(database, `books/${bookId}`), {
      updatedat: new Date().toISOString()
    });

    return chapterId;
  } catch (error) {
    console.error('Lỗi khi thêm chapter:', error);
    throw error;
  }
};

// Cập nhật nội dung chapter
export const updateChapterContent = async (bookId, chapterId, newContent, chapterTitle = null) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Upload nội dung mới
    const contentRef = storageRef(storage, `content/${bookId}/${chapterId}.txt`);
    const contentBlob = new Blob([newContent], {type: 'text/plain;charset=UTF-8'});
    await uploadBytes(contentRef, contentBlob);
    const contentUrl = await getDownloadURL(contentRef);

    // Cập nhật database
    const updates = {
      content: contentUrl,
      updatedat: new Date().toISOString()
    };

    if (chapterTitle) {
      updates.name = chapterTitle;
    }

    await update(ref(database, `books/${bookId}/chapters/${chapterId}`), updates);
    await update(ref(database, `books/${bookId}`), {
      updatedat: new Date().toISOString()
    });

  } catch (error) {
    console.error('Lỗi khi cập nhật chapter:', error);
    throw error;
  }
};

// Xóa chapter
export const deleteChapter = async (bookId, chapterId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Xóa file content
    try {
      const contentRef = storageRef(storage, `content/${bookId}/${chapterId}.txt`);
      await deleteObject(contentRef);
    } catch (error) {
      console.warn('Lỗi khi xóa file:', error);
    }

    // Xóa chapter khỏi database
    await remove(ref(database, `books/${bookId}/chapters/${chapterId}`));
    
    // Cập nhật book
    await update(ref(database, `books/${bookId}`), {
      updatedat: new Date().toISOString()
    });

    // Sắp xếp lại thứ tự các chapter
    await reorderChapters(bookId);

  } catch (error) {
    console.error('Lỗi khi xóa chapter:', error);
    throw error;
  }
};

// Đọc nội dung chapter
export const loadChapterContent = async (bookId, chapterId) => {
  try {
    const chapterRef = ref(database, `books/${bookId}/chapters/${chapterId}`);
    const snapshot = await get(chapterRef);
    if (!snapshot.exists()) throw new Error('Không tìm thấy chapter');

    const chapter = snapshot.val();
    const response = await fetch(chapter.content);
    if (!response.ok) throw new Error('Không thể tải nội dung');
    
    return await response.text();
  } catch (error) {
    console.error('Lỗi khi đọc nội dung chapter:', error);
    throw error;
  }
};

// Cập nhật thông tin truyện
export const updateStoryInfo = async (bookId, updateData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const updates = {
      ...updateData,
      updatedat: new Date().toISOString()
    };

    if (updateData.description) {
      const descRef = storageRef(storage, `description/${bookId}.txt`);
      const descBlob = new Blob([updateData.description], {type: 'text/plain;charset=UTF-8'});
      await uploadBytes(descRef, descBlob);
      updates.description = await getDownloadURL(descRef);
    }

    await update(ref(database, `books/${bookId}`), updates);
  } catch (error) {
    console.error('Lỗi khi cập nhật thông tin truyện:', error);
    throw error;
  }
};

// Cập nhật trạng thái truyện
export const updateStoryStatus = async (bookId, newStatus) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    await update(ref(database, `books/${bookId}`), {
      status: newStatus,
      updatedat: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái:', error);
    throw error;
  }
};

// Lấy danh sách truyện của user
export const getUserStories = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const booksRef = ref(database, 'books');
    const snapshot = await get(booksRef);
    const stories = [];

    snapshot.forEach((child) => {
      const story = child.val();
      if (story.user_id === user.uid) {
        stories.push({
          id: child.key,
          ...story
        });
      }
    });

    return stories;
  } catch (error) {
    console.error('Lỗi khi lấy danh sách truyện:', error);
    throw error;
  }
};

// Lấy chi tiết truyện
export const getStoryDetails = async (bookId) => {
  try {
    const bookRef = ref(database, `books/${bookId}`);
    const snapshot = await get(bookRef);
    if (!snapshot.exists()) throw new Error('Không tìm thấy truyện');

    const bookData = snapshot.val();
    return {
      id: snapshot.key,
      ...bookData
    };
  } catch (error) {
    console.error('Lỗi khi lấy chi tiết truyện:', error);
    throw error;
  }
};

// Utility functions
async function getNextOrderIndex(bookId) {
  const chaptersRef = ref(database, `books/${bookId}/chapters`);
  const snapshot = await get(chaptersRef);
  if (!snapshot.exists()) return 1;

  let maxOrder = 0;
  snapshot.forEach(child => {
    const order = child.val().orderindex || 0;
    if (order > maxOrder) maxOrder = order;
  });
  
  return maxOrder + 1;
}

async function reorderChapters(bookId) {
  try {
    const chaptersRef = ref(database, `books/${bookId}/chapters`);
    const snapshot = await get(chaptersRef);
    if (!snapshot.exists()) return;

    const chapters = [];
    snapshot.forEach(child => {
      chapters.push({
        id: child.key,
        ...child.val()
      });
    });

    chapters.sort((a, b) => a.orderindex - b.orderindex);
    
    const updates = {};
    chapters.forEach((chapter, index) => {
      updates[`books/${bookId}/chapters/${chapter.id}/orderindex`] = index + 1;
    });

    await update(ref(database), updates);
  } catch (error) {
    console.error('Lỗi khi sắp xếp lại chapters:', error);
    throw error;
  }
}