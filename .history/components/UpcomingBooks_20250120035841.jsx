import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, TouchableWithoutFeedback, ScrollView, Image, Dimensions, StyleSheet } from 'react-native';
import { database } from '../backend/firebase/FirebaseConfig'; // Import Firebase database
import { ref, get } from 'firebase/database'; // Import Firebase SDK functions
import { useRouter } from 'expo-router'; 


const { width, height } = Dimensions.get('window');
const ios = Platform.OS == 'ios';

const UpcomingBooks = ({ handleClick }) => {
    const router = useRouter();
  const [data, setData] = useState([]); // Dữ liệu sách
  const [authors, setAuthors] = useState({}); // Lưu trữ thông tin tác giả

  // Fetch dữ liệu sách và tác giả
  useEffect(() => {
    // Lấy danh sách tác giả
    const fetchAuthors = async () => {
      try {
        const authorsRef = ref(database, 'authors'); // Tham chiếu đến node "authors"
        const snapshot = await get(authorsRef);
        if (snapshot.exists()) {
          setAuthors(snapshot.val()); // Lưu dữ liệu tác giả vào state
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };

    // Lấy danh sách sách
    const fetchUpcomingBooks = async () => {
      try {
        const booksRef = ref(database, 'books'); // Tham chiếu đến node "books"
        const snapshot = await get(booksRef);
        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val()).map(([id, book]) => ({
            id,
            ...book,
          }));

          // Sắp xếp sách theo ngày tạo
          const sortedBooks = books
            .filter(book => book.createdat && !isNaN(new Date(book.createdat).getTime()))
            .sort((a, b) => new Date(b.createdat) - new Date(a.createdat));

          setData(sortedBooks); // Lưu sách vào state
        } else {
          console.log('No books found');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchAuthors();
    fetchUpcomingBooks();
  }, []);

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sách mới</Text>
        <Text style={styles.noDataText}>Không có sách mới</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Sách mới</Text>
        <Pressable onPress={() => router.push('/NewBooks')}>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </Pressable>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {data.map((item, index) => {
          // Lấy tên tác giả từ `authors` bằng cách đối chiếu authorId
          const authorNames = item.authors
            ? Object.keys(item.authors).map(authorId => authors[authorId]?.name).filter(name => name)
            : [];

          return (
            <TouchableWithoutFeedback
              key={index}
              onPress={() => handleClick(item)}
            >
              <View style={styles.bookContainer}>
                <Image 
                  source={item.image ? { uri: item.image } : require('../assets/images/books/3.png')}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={styles.infoContainer}>
                  <Text 
                    style={styles.bookTitle} 
                    numberOfLines={2}
                  >
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
            </TouchableWithoutFeedback>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
    gap: 12,
  },
  headerContainer: {
    marginHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '600',
  },
  seeAllText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  noDataText: {
    color: '#9CA3AF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  scrollViewContent: {
    paddingHorizontal: 16,
  },
  bookContainer: {
    marginRight: 16,
    width: width * 0.35,
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bookImage: {
    width: '100%',
    height: height * 0.25,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  infoContainer: {
    padding: 8,
  },
  bookTitle: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  bookAuthor: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 4,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  statsText: {
    color: '#D1D5DB',
    fontSize: 12,
  }
});

export default UpcomingBooks;
