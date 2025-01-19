import React, { useState, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, ScrollView, Image, Dimensions, StyleSheet } from 'react-native';
import { database } from './firebase';  // Import Firebase database (giả sử bạn đã cấu hình)
import { ref, get } from 'firebase/database'; // Import Firebase SDK functions
import { useSharedValue } from 'react-native-reanimated';  // Nếu bạn dùng reanimated cho animation

const { width, height } = Dimensions.get('window');

const UpcomingBooks = ({ handleClick }) => {
  const [data, setData] = useState([]);
  const animationValue = useSharedValue(0);

  // Fetch dữ liệu sách sắp ra mắt
  useEffect(() => {
    const fetchUpcomingBooks = async () => {
      try {
        const booksRef = ref(database, 'books');  // Tham chiếu đến node "books" trong Firebase
        const snapshot = await get(booksRef);

        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val()).map(([id, book]) => ({
            id,
            ...book,
          }));

          // Lọc sách sắp ra mắt: Giả sử có trường `created_at` là thời gian xuất bản
          const upcomingBooks = books.filter(book => new Date(book.created_at) > new Date('2024-01-01'));  // Điều kiện có thể thay đổi

          // Sắp xếp theo ngày xuất bản giảm dần
          upcomingBooks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

          setData(upcomingBooks);  // Cập nhật dữ liệu sách sắp ra mắt
        } else {
          console.log('No upcoming books found');
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      }
    };

    fetchUpcomingBooks();
  }, []);  // Chạy một lần khi component mount

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Sách sắp ra mắt</Text>
        <Text style={styles.noDataText}>Không có sách sắp ra mắt</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Sách sắp ra mắt</Text>
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
          return (
            <TouchableWithoutFeedback
              key={index}
              onPress={() => handleClick(item)}
            >
              <View style={styles.bookContainer}>
                <Image 
                  source={item.imageUrl ? { uri: item.imageUrl } : require('../assets/images/books/3.png')}
                  style={styles.bookImage}
                  resizeMode="cover"
                />
                <View style={styles.infoContainer}>
                  <Text 
                    style={styles.bookTitle} 
                    numberOfLines={2}
                  >
                    {item.title || 'Tên sách'}
                  </Text>
                  <Text style={styles.bookAuthor} numberOfLines={1}>
                    {item.author || 'Tác giả'}
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
