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
  const [authors, setAuthors] = useState({});

  // Fetch data
  useEffect(() => {
    // Lấy danh sách tác giả
    const fetchAuthors = async () => {
      try {
        const authorsRef = ref(database, 'authors');
        const snapshot = await get(authorsRef);
        if (snapshot.exists()) {
          setAuthors(snapshot.val());
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };

    // Lấy danh sách sách
    const fetchBooks = async () => {
      try {
        const booksRef = ref(database, 'books');
        const snapshot = await get(booksRef);
        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val()).map(([id, book]) => ({
            id,
            ...book,
          }));

          // Sắp xếp sách theo ngày tạo và lấy 30 sách mới nhất
          const sortedBooks = books
            .filter(book => book.createdat && !isNaN(new Date(book.createdat).getTime()))
            .sort((a, b) => new Date(b.createdat) - new Date(a.createdat))
            .slice(0, 30);

          setData(sortedBooks);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchAuthors();
    fetchBooks();
  }, []);

  const renderBook = ({ item }) => {
    // Lấy tên tác giả
    const authorNames = item.authors
      ? Object.keys(item.authors).map(authorId => authors[authorId]?.name).filter(name => name)
      : [];

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

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.noDataText}>Không có sách mới</Text>
      </View>
    );
  }

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
          <TouchableOpacity onPress={() => router.push('/SearchScreen')}>
            <MagnifyingGlassIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    <FlatList
        data={data}
        renderItem={renderBook}
        keyExtractor={item => item.id}
        numColumns={3}
        contentContainerStyle={styles.flatListContent}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
      />
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
  },
});

export default NewBooks;
