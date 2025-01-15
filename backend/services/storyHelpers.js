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
    
    // Chuẩn bị dữ liệu truyện
    const newStory = {
      name: storyData.title,
      description: storyData.description,
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