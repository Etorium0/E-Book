import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { database } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';

const NewBooks = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const booksRef = ref(database, 'books');
        const snapshot = await get(booksRef);
        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val()).map(([id, book]) => ({
            id,
            ...book,
          }));
          const sortedBooks = books
            .filter(book => book.createdat && !isNaN(new Date(book.createdat).getTime()))
            .sort((a, b) => new Date(b.createdat) - new Date(a.createdat))
            .slice(0, 30); // Chỉ lấy 30 sách mới nhất

          setData(sortedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchBooks();
  }, []);

  return (
    <ScrollView 
      style={styles.scrollView} 
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ paddingBottom: 100 }} >
      <SafeAreaView style={styles.header}>
      <Text style={styles.title}>Danh sách sách mới</Text>
        </SafeAreaView>
      
      {data.map(book => (
        <Text key={book.id} style={styles.bookItem}>
          {book.name}
        </Text>
      ))}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  bookItem: {
    fontSize: 16,
    marginBottom: 8,
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
  title: {
    color: 'black',
    fontSize: 30,
    fontWeight: 'bold',
    alignItems: 'center',
  },
});

export default NewBooks;
