import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useRouter, useSearchParams } from 'expo-router'; // Sử dụng useRouter và useSearchParams
import { db } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import BackButton from '../components/BackButton';
import { useParams } from 'expo-router';

const { width, height } = Dimensions.get('window');

const CategoryDetail = () => {
 const { categoryId, categoryName } = useParams()
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchBooksByCategory();
  }, [categoryId]);

  const fetchBooksByCategory = async () => {
    try {
      const booksRef = ref(db, 'books');
      const snapshot = await get(booksRef);

      if (snapshot.exists()) {
        const booksData = snapshot.val();
        const booksArray = Object.values(booksData);

        // Lọc sách theo thể loại
        const filteredBooks = booksArray.filter(book =>
          book.categories && Object.keys(book.categories).includes(categoryId)
        );

        setBooks(filteredBooks);
      }
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBook = ({ item }) => {
    const authorNames = item.authors || [];
    return (
      <View style={styles.bookContainer}>
        <Image
          source={item.image ? { uri: item.image } : require('../assets/images/books/3.png')}
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
    );
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!books || books.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Không có sách trong thể loại này</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>{categoryName}</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        numColumns={3}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  header: {
    backgroundColor: '#1F1F1F',
    borderBottomWidth: 0.3,
    borderBottomColor: '#333',
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
  },
  flatListContent: {
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  bookContainer: {
    width: (width - 64) / 3, // Tính toán chiều rộng cho 3 cột
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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
});

export default CategoryDetail;
