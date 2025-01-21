import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { useLocalSearchParams } from 'expo-router'; // Thay vì useSearchParams
import { db } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import BackButton from '../components/BackButton';

const CategoryDetail = () => {
  const { categoryId } = useLocalSearchParams(); // Lấy tham số categoryId từ URL
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const renderBook = ({ item }) => (
    <TouchableOpacity style={styles.bookItem}>
      <Text style={styles.bookTitle}>{item.name}</Text>
      <Text style={styles.bookAuthor}>{item.authors ? item.authors.join(', ') : 'Tác giả không rõ'}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <BackButton onPress={() => router.back()} />
        <Text style={styles.headerTitle}>Category: {categoryId}</Text>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        renderItem={renderBook}
        style={styles.bookList}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
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
  bookList: {
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  bookItem: {
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  bookTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  bookAuthor: {
    color: '#666',
    fontSize: 14,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CategoryDetail;
