import { database, storage, auth } from '../firebase/FirebaseConfig';
import { ref, push, set, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

// Hàm tạo truyện mới
export const createNewStory = async (storyData, coverImage) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Upload ảnh bìa nếu có
    let coverImageUrl = '';
    if (coverImage) {
      const imageRef = storageRef(storage, `covers/${user.uid}/${Date.now()}`);
      const response = await fetch(coverImage);
      const blob = await response.blob();
      await uploadBytes(imageRef, blob);
      coverImageUrl = await getDownloadURL(imageRef);
    }

    // Tạo reference cho truyện mới
    const storyRef = push(ref(database, 'books'));
    
    // Chuyển đổi description thành base64 để hỗ trợ UTF-8
    const encodedDescription = btoa(unescape(encodeURIComponent(storyData.description)));
    
    // Chuẩn bị dữ liệu truyện
    const newStory = {
      name: storyData.title,
      description: encodedDescription, // Lưu dưới dạng base64
      image: coverImageUrl,
      user_id: user.uid,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
      status: 'pending',
      view: 0,
      rating: 0,
      totalrating: 0,
      totalcomment: 0,
      categories: {},
      authors: {
        [user.uid]: true
      },
      chapters: {}
    };

    // Lưu truyện vào database
    await set(storyRef, newStory);
    return storyRef.key;
  } catch (error) {
    console.error('Lỗi khi tạo truyện:', error);
    throw error;
  }
};

// Hàm đọc nội dung chương với UTF-8
export const loadChapterContent = async (contentUrl) => {
  try {
    const response = await fetch(contentUrl);
    if (!response.ok) {
      throw new Error('Không thể tải nội dung chương');
    }
    const text = await response.text();
    return text; // Nội dung đã được decode tự động với UTF-8
  } catch (error) {
    console.error('Lỗi khi tải nội dung chương:', error);
    throw error;
  }
};

// Hàm thêm chương mới
export const addChapter = async (storyId, chapterData) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Kiểm tra quyền sở hữu truyện
    const storyRef = ref(database, `books/${storyId}`);
    const storySnapshot = await get(storyRef);
    const storyData = storySnapshot.val();

    if (storyData.user_id !== user.uid) {
      throw new Error('Không có quyền chỉnh sửa truyện này');
    }

    // Tạo reference cho chương mới
    const chapterRef = push(ref(database, `books/${storyId}/chapters`));
    
    // Chuẩn bị dữ liệu chương
    const newChapter = {
      name: chapterData.title,
      content: chapterData.content,
      orderindex: Object.keys(storyData.chapters || {}).length + 1,
      createdat: new Date().toISOString(),
      updatedat: new Date().toISOString(),
      view: 0
    };

    // Lưu chương vào database
    await set(chapterRef, newChapter);
    return chapterRef.key;
  } catch (error) {
    console.error('Lỗi khi thêm chương:', error);
    throw error;
  }
};

// Hàm cập nhật nội dung chương
export const updateChapterContent = async (storyId, chapterId, newContent) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const chapterRef = ref(database, `books/${storyId}/chapters/${chapterId}`);
    await update(chapterRef, {
      content: newContent,
      updatedat: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật nội dung chương:', error);
    throw error;
  }
};

// Hàm lấy danh sách truyện của người dùng
export const getUserStories = async () => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const storiesRef = ref(database, 'books');
    const snapshot = await get(storiesRef);
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

export const getStoryDetails = async (storyId) => {
  try {
    const storyRef = ref(database, `books/${storyId}`);
    const snapshot = await get(storyRef);
    if (!snapshot.exists()) {
      throw new Error('Không tìm thấy truyện');
    }
    return {
      id: snapshot.key,
      ...snapshot.val()
    };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin truyện:', error);
    throw error;
  }
};

// Thêm hàm lấy thông tin chi tiết của một chương
export const getChapterDetails = async (storyId, chapterId) => {
  try {
    const chapterRef = ref(database, `books/${storyId}/chapters/${chapterId}`);
    const snapshot = await get(chapterRef);
    if (!snapshot.exists()) {
      throw new Error('Không tìm thấy chương');
    }
    return {
      id: snapshot.key,
      ...snapshot.val()
    };
  } catch (error) {
    console.error('Lỗi khi lấy thông tin chương:', error);
    throw error;
  }
};

// Thêm hàm xóa một chương
export const deleteChapter = async (storyId, chapterId) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    // Kiểm tra quyền sở hữu
    const storyRef = ref(database, `books/${storyId}`);
    const storySnapshot = await get(storyRef);
    const storyData = storySnapshot.val();

    if (storyData.user_id !== user.uid) {
      throw new Error('Không có quyền xóa chương này');
    }

    // Xóa chương khỏi database
    const chapterRef = ref(database, `books/${storyId}/chapters/${chapterId}`);
    await remove(chapterRef);

    // Nếu có file content trong storage thì xóa
    try {
      const contentRef = storageRef(storage, `content/${storyId}/${chapterId}`);
      await deleteObject(contentRef);
    } catch (error) {
      console.warn('Không tìm thấy file content để xóa:', error);
    }
  } catch (error) {
    console.error('Lỗi khi xóa chương:', error);
    throw error;
  }
};

// Thêm hàm cập nhật thứ tự các chương
export const updateChapterOrder = async (storyId, chapterId, newOrder) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const chapterRef = ref(database, `books/${storyId}/chapters/${chapterId}`);
    await update(chapterRef, {
      orderindex: newOrder,
      updatedat: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật thứ tự chương:', error);
    throw error;
  }
};

// Thêm hàm cập nhật trạng thái truyện
export const updateStoryStatus = async (storyId, newStatus) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('Người dùng chưa đăng nhập');

    const storyRef = ref(database, `books/${storyId}`);
    await update(storyRef, {
      status: newStatus,
      updatedat: new Date().toISOString()
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật trạng thái truyện:', error);
    throw error;
  }
};

// Thêm hàm lấy danh sách chương của một truyện
export const getChaptersList = async (storyId) => {
  try {
    const chaptersRef = ref(database, `books/${storyId}/chapters`);
    const snapshot = await get(chaptersRef);
    if (!snapshot.exists()) {
      return [];
    }

    const chapters = [];
    snapshot.forEach((child) => {
      chapters.push({
        id: child.key,
        ...child.val()
      });
    });

    // Sắp xếp theo thứ tự
    return chapters.sort((a, b) => a.orderindex - b.orderindex);
  } catch (error) {
    console.error('Lỗi khi lấy danh sách chương:', error);
    throw error;
  }
};