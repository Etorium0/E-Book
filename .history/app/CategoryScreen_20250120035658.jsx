import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { db } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { useRouter } from 'expo-router'; 

const { width, height } = Dimensions.get('window');

const CategoryScreen = ()=> {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter(); // Khai báo router

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
  try {
    const categoriesRef = ref(db, 'categories');
    const snapshot = await get(categoriesRef);
    
    if (snapshot.exists()) {
      const categoriesData = Object.entries(snapshot.val()).map(([key, value]) => ({
        id: key,
        name: value.name,
        description: value.description,
        bookcount: 0, // Khởi tạo bookcount là 0
        keyword: value.keyword,
        parentId: value.parentId || 0,
        createdat: value.createdat,
        updatedat: value.updatedat
      }));

      // Lấy danh sách sách từ Firebase
      const booksRef = ref(db, 'books');
      const booksSnapshot = await get(booksRef);

      if (booksSnapshot.exists()) {
        const booksData = booksSnapshot.val();
        
        // Chuyển đối tượng booksData thành mảng
        const booksArray = Object.values(booksData);
        
        // Đếm số lượng sách cho từng thể loại
        booksArray.forEach(book => {
          const categoryIds = Object.keys(book.categories || {});
          categoryIds.forEach(categoryId => {
            const category = categoriesData.find(cat => cat.id === categoryId);
            if (category) {
              category.bookcount += 1; // Tăng số lượng sách cho thể loại này
            }
          });
        });
      }

      // Lọc ra các categories có parentId = 0 (categories gốc)
      const rootCategories = categoriesData.filter(cat => cat.parentId === 0);
      
      // Sắp xếp theo tên
      rootCategories.sort((a, b) => a.name.localeCompare(b.name));

      // Kiểm tra số lượng sách của mỗi thể loại
      rootCategories.forEach(category => {
        console.log(`Category: ${category.name}, Book Count: ${category.bookcount}`);
      });

      setCategories(rootCategories);
    } else {
      console.log("No categories data available");
      setCategories([]);
    }
  } catch (error) {
    console.error('Error details:', error);
  } finally {
    setLoading(false);
  }
};

  const handleCategoryPress = (category) => {
    router.push(`/category/${category.id}?categoryName=${category.name}`);
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View style={styles.headerContent}>
         <BackButton onPress={() => router.back()} />
          <Text style={styles.headerTitle}>Thể loại</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={true}
        scrollIndicatorInsets={{ right: 1 }}
      >
        <View style={styles.categoriesContainer}>
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={styles.categoryItem}
              onPress={() => handleCategoryPress(category)}
            >
              <View style={styles.categoryContent}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  {category.description && (
                    <Text style={styles.categoryDescription} numberOfLines={1}>
                      {category.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.categoryCount}>
                  {category.bookcount || 0} cuốn
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 0.3,
    borderBottomColor: '#333',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  categoriesContainer: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  categoryItem: {
    paddingVertical: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  categoryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flex: 1,
    marginRight: 16,
  },
  categoryName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '400',
    marginBottom: 4,
  },
  categoryDescription: {
    color: '#666',
    fontSize: 12,
  },
  categoryCount: {
    color: '#666',
    fontSize: 14,
  },
});

export default CategoryScreen;