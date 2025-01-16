import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth, db } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import BackButton from '../components/BackButton';

export default function BookListScreen() {
  const params = useLocalSearchParams();
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Lấy title dựa vào categoryId
  const getCategoryTitle = (id) => {
    switch (id) {
      case '1': return 'Đang đọc';
      case '2': return 'Muốn đọc';
      case '3': return 'Đã đọc xong';
      case '4': return 'Bộ sưu tập';
      default: return '';
    }
  };

  const fetchBooks = async () => {
    try {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      // Xác định collection cần truy vấn
      let collectionName = '';
      switch (params.categoryId) {
        case '1':
          collectionName = 'reading';
          break;
        case '2':
          collectionName = 'toreading';
          break;
        case '3':
          collectionName = 'finished';
          break;
        case '4':
          collectionName = 'favorites';
          break;
      }

      // Lấy danh sách ID sách từ collection của user
      const userBooksRef = ref(db, `users/${userId}/${collectionName}`);
      const userBooksSnapshot = await get(userBooksRef);
      
      if (!userBooksSnapshot.exists()) {
        setBooks([]);
        setLoading(false);
        return;
      }

      // Lấy thông tin chi tiết của từng cuốn sách
      const booksRef = ref(db, 'books');
      const booksSnapshot = await get(booksRef);
      const allBooks = booksSnapshot.val();

      const userBookIds = Object.keys(userBooksSnapshot.val());
      const booksList = userBookIds.map(bookId => ({
        id: bookId,
        ...allBooks[bookId]
      }));

      setBooks(booksList);
    } catch (error) {
      console.error('Error fetching books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, [params.categoryId]);

  const renderEmptyState = () => (
    <View style={styles.emptyStateContainer}>
      <Icon name="menu-book" size={48} color="#666" />
      <Text style={styles.emptyStateText}>
        Không có sách nào trong danh mục này
      </Text>
    </View>
  );

  const renderBookItem = ({ item }) => (
    <TouchableOpacity style={styles.bookItem}>
      <Image
        source={{ uri: item.image }}
        style={styles.bookCover}
        resizeMode="cover"
      />
      <View style={styles.bookInfo}>
        <Text style={styles.bookTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <View style={styles.bookMeta}>
          <Text style={styles.bookAuthor} numberOfLines={1}>
            {Object.keys(item.authors || {}).join(', ')}
          </Text>
          <View style={styles.ratingContainer}>
            <Icon name="star" size={16} color="#FFD700" />
            <Text style={styles.ratingText}>{item.rating?.toFixed(1) || "0.0"}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <BackButton style={styles.backButton} />
        <Text style={styles.headerTitle}>
          {getCategoryTitle(params.categoryId)}
        </Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      ) : (
        <FlatList
          data={books}
          renderItem={renderBookItem}
          keyExtractor={item => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: 60,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    marginTop: 100,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  listContainer: {
    padding: 16,
  },
  bookItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  bookCover: {
    width: 80,
    height: 120,
  },
  bookInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  bookTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  bookMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookAuthor: {
    fontSize: 14,
    color: '#666666',
    flex: 1,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 14,
    marginLeft: 4,
  },
});