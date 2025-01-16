import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { auth } from '../backend/firebase/FirebaseConfig';
import { libraryService } from '../backend/services/libraryService';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

function LibraryScreen() {
  const [bookCounts, setBookCounts] = useState({
    reading: 0,
    wantToRead: 0,
    finished: 0,
    favorites: 0
  });

  const [loading, setLoading] = useState(true);

  const categories = [
    { id: '1', title: 'Đang đọc', icon: 'book', color: '#4CAF50', count: bookCounts.reading },
    { id: '2', title: 'Muốn đọc', icon: 'bookmark', color: '#2196F3', count: bookCounts.wantToRead },
    { id: '3', title: 'Đã đọc xong', icon: 'check-circle', color: '#9C27B0', count: bookCounts.finished },
    { id: '4', title: 'Bộ sưu tập', icon: 'collections-bookmark', color: '#FF9800', count: bookCounts.favorites },
  ];

  useEffect(() => {
    const loadBookCounts = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userId = currentUser.uid;
          
          // Sử dụng libraryService để lấy số lượng sách
          const [reading, wantToRead, finished, favorites] = await Promise.all([
            libraryService.getReadingBooks(userId),
            libraryService.getWantToReadBooks(userId),
            libraryService.getFinishedBooks(userId),
            libraryService.getFavoriteBooks(userId)
          ]);

          setBookCounts({
            reading,
            wantToRead,
            finished,
            favorites
          });
        }
      } catch (error) {
        console.error("Error loading book counts:", error);
      } finally {
        setLoading(false);
      }
    };

    loadBookCounts();
  }, []);

  const handleCategoryPress = (categoryId) => {
    router.push({
      pathname: "/BookListScreen",
      params: { categoryId }
    });
  };

  const renderContent = () => {
    if (loading) {
      return (
        <View style={styles.emptyStateContainer}>
          <Text style={styles.loadingText}>Đang tải...</Text>
        </View>
      );
    }

    const totalBooks = Object.values(bookCounts).reduce((a, b) => a + b, 0);
    
    if (totalBooks === 0) {
      return (
        <View style={styles.emptyStateContainer}>
          <Icon name="menu-book" size={48} color="#666" />
          <Text style={styles.emptyStateText}>
            Bạn chưa có sách nào trong thư viện
          </Text>
        </View>
      );
    }

    return (
      <ScrollView style={styles.scrollView}>
        {categories.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.categoryItem}
            onPress={() => handleCategoryPress(item.id)}
          >
            <View style={styles.iconContainer}>
              <Icon name={item.icon} size={24} color={item.color} />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.categoryTitle}>{item.title}</Text>
              <Text style={styles.bookCount}>{item.count} cuốn sách</Text>
            </View>
            <Icon name="chevron-right" size={24} color="#666" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thư viện của tôi</Text>
      </View>
      {renderContent()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: '#333',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1A1A1A',
    marginVertical: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 16,
  },
  categoryTitle: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  bookCount: {
    fontSize: 14,
    color: '#666666',
    marginTop: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    marginTop: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#666666',
  }
});

export default LibraryScreen;