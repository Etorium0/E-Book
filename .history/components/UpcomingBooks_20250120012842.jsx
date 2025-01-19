import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, ScrollView, Image, Dimensions, StyleSheet } from 'react-native';
import { database } from '../backend/firebase/FirebaseConfig'; // Import Firebase database
import { ref, get } from 'firebase/database'; // Import Firebase SDK functions

const { width, height } = Dimensions.get('window');

const UpcomingBooks = ({ handleClick }) => {
  const [data, setData] = useState([]);
  const [authors, setAuthors] = useState({}); // Lưu trữ dữ liệu tác giả

  // Fetch dữ liệu sách sắp ra mắt và danh sách tác giả
  useEffect(() => {
    const fetchAuthors = async () => {
      try {
        const authorsRef = ref(database, 'authors'); // Lấy dữ liệu từ node "authors"
        const snapshot = await get(authorsRef);
        if (snapshot.exists()) {
          setAuthors(snapshot.val()); // Lưu danh sách tác giả vào state
        }
      } catch (error) {
        console.error('Error fetching authors:', error);
      }
    };

    const fetchUpcomingBooks = async () => {
      try {
        const booksRef = ref(database, 'books');  // Tham chiếu đến node "books" trong Firebase
        const snapshot = await get(booksRef);

        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val()).map(([id, book]) => ({
            id,
            ...book,
          }));

          console.log('Fetched books:', books);

          // Lọc và sắp xếp sách theo ngày tạo (mới nhất trước)
          const sortedBooks = books
            .filter(book => {
              const createdAt = book.createdat;
              console.log('Checking book createdat:', createdAt); // Kiểm tra giá trị `createdat`

              // Kiểm tra nếu `createdat` hợp lệ
              if (!createdAt || isNaN(new Date(createdAt).getTime())) {
                console.log(`Invalid date for book ${book.name}:`, createdAt);
                return false; // Nếu không hợp lệ, bỏ qua sách này
              }

              return true; // Chỉ giữ sách có `createdat` hợp lệ
            })
            .sort((a, b) => new Date(b.createdat) - new Date(a.createdat)); // Sắp xếp theo ngày tạo mới nhất

          console.log('Sorted books:', sortedBooks); // In ra sách đã sắp xếp
          setData(sortedBooks);  // Cập nhật dữ liệu sách mới nhất
        } else {
          console.log('No books found');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchAuthors();  // Lấy danh sách tác giả
    fetchUpcomingBooks();  // Lấy sách sắp ra mắt
  }, []);  // Chạy một lần khi component mount

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
        <TouchableWithoutFeedback>
          <Text style={styles.seeAllText}>Xem tất cả</Text>
        </TouchableWithoutFeedback>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollViewContent}
      >
        {data.map((item, index) => {
          // Lấy tên tác giả từ `authors` bằng cách sử dụng authorId
          const authorNames = item.authors ? Object.keys(item.authors).map(authorId => authors[authorId]?.name).filter(name => name) : [];

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
                    {authorNames.length > 0 ? authorNames.join(", ") : 'Tác giả'}
                  </Text>
                  <View style={styles.statsRow}>
                    <Text style={styles.statsText}>👁 {item.view || 0}</Text>
                    <Text style={styles.statsText}>⭐ {item.totalrating || 0}</Text>
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
