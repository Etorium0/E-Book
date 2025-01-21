import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, Image, ActivityIndicator, TouchableOpacity, StyleSheet, Dimensions, Pressable, Platform } from 'react-native';
import { useLocalSearchParams } from 'expo-router'; // Use this instead of useRoute
import { db } from '../../backend/firebase/FirebaseConfig';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { ref, get } from 'firebase/database';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import BackButton from '../../components/BackButton';
import { bookService } from '../../backend/services/bookManagement';
import { useRouter } from 'expo-router';

const {width, height} = Dimensions.get('window');
const ios = Platform.OS == 'ios';

const CategoryDetailScreen = () => {
  const [category, setCategory] = useState(null);
  const [books, setBooks] = useState([]); // State to hold books based on category
  const [loading, setLoading] = useState(true);
  const [authors, setAuthors] = useState({});
const router = useRouter();

  // Use useLocalSearchParams to get route params
  const { id } = useLocalSearchParams(); 

  useEffect(() => {
    if (id) {
      fetchCategoryDetail();
      fetchBooksByCategory();
        fetchAuthors();
    }
  }, [id]);

  const fetchCategoryDetail = async () => {
    try {
      const categoryRef = ref(db, `categories/${id}`);
      const snapshot = await get(categoryRef);

      if (snapshot.exists()) {
        setCategory(snapshot.val());
      } else {
        console.log("No category data found");
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  };
  const fetchAuthors = async () => {
  try {
    const authorsRef = ref(db, 'authors');
    const snapshot = await get(authorsRef);
    if (snapshot.exists()) {
      setAuthors(snapshot.val());
    } else {
      console.log("No authors data found");
    }
  } catch (error) {
    console.error('Error fetching authors:', error);
  }
};

  const fetchBooksByCategory = async () => {
    try {
      const booksRef = ref(db, 'books');
      const snapshot = await get(booksRef);

      if (snapshot.exists()) {
        const allBooks = Object.entries(snapshot.val()).map(([id, book]) => ({
          id,
          ...book,
        }));

        // Lọc sách theo thể loại
        const filteredBooks = allBooks.filter(book =>
  book.categories && book.categories.hasOwnProperty(id)
);

        setBooks(filteredBooks);
      } else {
        console.log("No books found");
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Không tìm thấy thể loại này</Text>
      </View>
    );
  }

 const renderBook = ({ item }) => {
   // Lấy tên tác giả
   const authorNames = item.authors
     ? Object.keys(item.authors).map(authorId => authors[authorId]?.name).filter(name => name)
     : [];
 
   const handleBookClick = async () => {
  try {
    // Cập nhật lượt xem khi nhấn vào sách
    await bookService.updateBook(item.id, {
      view: (item.view || 0) + 1
    });

    // Điều hướng đến BookScreen với thông tin của sách
    router.push({
      pathname: '/BookScreen',
      params: {
        id: item.id,
        title: item.name,
        author: authorNames.join(', '),
        description: item.description,
        imageUrl: item.image
      }
    });
  } catch (error) {
    console.error("Lỗi khi cập nhật lượt xem:", error);
  }
};
 
 
     return (
     <Pressable onPress={handleBookClick}>
       <View style={styles.bookContainer}>
         <Image
           source={item.image ? { uri: item.image } : require('../../assets/images/books/3.png')}
           style={styles.bookImage}
           resizeMode="cover"
         />
         <View style={styles.infoContainer}>
           <Text style={styles.bookTitle} numberOfLines={2}>
             {item.name || 'Tên sách'}
           </Text>
           <Text style={styles.bookAuthor} numberOfLines={1}>
             {authorNames.length > 0 ? authorNames.join(', ') : 'Tác giả'}
           </Text>
           <View style={styles.statsRow}>
             <Text style={styles.statsText}>👁 {item.view || 0}</Text>
             <Text style={styles.statsText}>⭐ {item.rating || 0}</Text>
           </View>
         </View>
       </View>
     </Pressable>
   );
 };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity >
            <BackButton style={styles.headerIcon} />
          </TouchableOpacity>
          <Text style={styles.categoryTitle}>{category.name}</Text>
          <TouchableOpacity onPress={() => router.push('/SearchScreen')}>
            <MagnifyingGlassIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
      {books.length === 0 ? (
        <Text style={styles.noDataText}>Không có sách nào trong thể loại này</Text>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBook}
          keyExtractor={item => item.id}
          numColumns={3}
          contentContainerStyle={styles.flatListContent}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    paddingTop: 25,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  safeArea: {
    backgroundColor: '#1F1F1F',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 16,
    paddingVertical: 10,
  },
  categoryTitle: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
  },
  noDataText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  flatListContent: {
    paddingBottom: 16,
    paddingHorizontal: 10, 
  },
  row: {
    justifyContent: 'flex-start',  // Căn trái
    marginBottom: 16,
  },
   bookContainer: {
    width: (width - 64) / 3,  // Giữ nguyên chiều rộng cho 3 cột
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
     marginLeft: 8,  // Khoảng cách giữa các sách theo chiều ngang
    marginRight: 8,
  },
  bookImage: {
    width: '100%',
    height: height * 0.15,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 8,
  },
  bookTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#9CA3AF',
    fontSize: 10,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statsText: {
    color: '#D1D5DB',
    fontSize: 10,
  },
  errorText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
});

export default CategoryDetailScreen;
