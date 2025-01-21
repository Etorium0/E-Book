import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TouchableOpacity, StyleSheet, Dimensions, Pressable, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import { database } from '../backend/firebase/FirebaseConfig';
import { ref, get } from 'firebase/database';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router'; 
import BackButton from '../components/BackButton';
import { bookService } from '../backend/services/bookManagement';
import { readingService } from '../backend/services/readingService';

const {width, height} = Dimensions.get('window');
const ios = Platform.OS == 'ios';





const NewBooks = () => {
  const router = useRouter();
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

  const handleBookClick = async () => {
    try {
      // Cập nhật lượt xem khi nhấn vào sách
      // Giả sử bạn có một phương thức `updateBook` tương tự trong `HomeScreens`
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
    </Pressable>
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
});

export default NewBooks;
