import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform, Image, StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeartIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon, ShareIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';
import BackButton from '../components/BackButton';
import { bookService } from '../backend/services/bookManagement';
import { readingService } from '../backend/services/readingService';
import { auth } from '../backend/firebase/FirebaseConfig';
import { getStorage, ref, getDownloadURL } from 'firebase/storage'; 

const {width, height} = Dimensions.get('window');
const ios = Platform.OS == 'ios';

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
          <BackButton style={styles.headerIcon} />
          <TouchableOpacity onPress={handleShare}>
            <ShareIcon size={24} color="#FFF" style={styles.headerIcon} />
          </TouchableOpacity>
        </SafeAreaView>
      <Text style={styles.title}>Danh sách sách mới</Text>
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
});

export default NewBooks;
