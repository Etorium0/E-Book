import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { database } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import BackButton from '../components/BackButton';

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
    
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity >
            <BackButton style={styles.headerIcon} />
          </TouchableOpacity>
          <Text style={styles.logoText}>
            Sách mới
          </Text>
        </View>
      </SafeAreaView>
    <ScrollView ></ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
   container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
    paddingTop: 25,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: 'white',
    fontSize: 18,
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
  logoText: {
    color: 'white',
    fontSize: 26,
    fontWeight: 'bold',
      justifyContent: 'center',
  },
});

export default NewBooks;
