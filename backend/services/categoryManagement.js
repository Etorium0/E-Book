import { db } from '../firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';

// Lấy tất cả danh sách thể loại và xử lý từng thể loại
export const getAllCategories = async () => {
  const categoriesRef = ref(db, 'categories');
  try {
    const snapshot = await get(categoriesRef);
    const categories = snapshot.val();

    if (categories) {
      const categoryDetails = [];

      // Lặp qua từng thể loại và lấy thông tin chi tiết
      for (const categoryId in categories) {
        const categoryData = categories[categoryId];
        console.log(`Processing category ${categoryId}:`, categoryData); // Log category data

        // Xử lý mỗi thể loại ở đây
        categoryDetails.push({
          id: categoryId,
          name: categoryData.name,
          description: categoryData.description,
          keyword: categoryData.keyword,
          bookCount: categoryData.book_count,
          createdAt: categoryData.created_at,
          updatedAt: categoryData.updated_at,
        });
      }

      console.log("All categories processed:", categoryDetails); // Log all processed categories
      return categoryDetails; // Return the list of processed categories
    } else {
      console.log('No categories found.');
      return []; // Return empty if no categories exist
    }
  } catch (error) {
    console.error("Error fetching categories:", error);
    return { success: false, message: error.message }; // Handle any errors
  }
};
