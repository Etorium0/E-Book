import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import React, { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Bars3CenterLeftIcon, MagnifyingGlassIcon } from 'react-native-heroicons/outline';
import TrendingBooks from '../components/TrendingBooks';
import BookList from '../components/bookList';
import { useRouter } from 'expo-router';
import { bookService } from '../backend/services/bookManagement';

const HomeScreens = () => {
  const [trending, setTrending] = useState([]);
  const [upcoming, setUpcoming] = useState([]);
  const [topRated, setTopRated] = useState([]);
  const [loading, setLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      // Lấy sách trending
      const trendingData = await bookService.getTrendingBooks(3);
      setTrending(trendingData);

      // Lấy sách mới
      const upcomingData = await bookService.getUpcomingBooks(3);
      setUpcoming(upcomingData);

      // Lấy sách đánh giá cao
      const topRatedData = await bookService.getTopRatedBooks(3);
      setTopRated(topRatedData);
    } catch (error) {
      console.error("Error fetching books:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleClick = async (item) => {
    try {
      // Cập nhật lượt xem khi click vào sách
      await bookService.updateBook(item.id, {
        view: (item.view || 0) + 1
      });
      
      // Chuyển đến trang chi tiết sách
      router.push({
        pathname: '/BookScreen',
        params: {
          id: item.id,
          title: item.title,
          author: item.author,
          description: item.description,
          imageUrl: item.imageUrl
        }
      });
    } catch (error) {
      console.error("Error updating view count:", error);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="light" />
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.optionButton}
            onPress={() => router.push('/CategoryScreen')}
          >
            <Bars3CenterLeftIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
          <Text style={styles.logoText}>
            <Text style={styles.logoHighlight}>E</Text>-Books
          </Text>
          <TouchableOpacity onPress={() => router.push('/SearchScreen')}>
            <MagnifyingGlassIcon size={30} strokeWidth={2} color="white" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshing={loading}
        onRefresh={fetchBooks}
      >
        {/* Trending Books */}
        <TrendingBooks data={trending} handleClick={handleClick} />

        {/* Upcoming Books */}
        <BookList title="Sách Mới" data={upcoming} handleClick={handleClick} />

        {/* TopRated Books */}
        <BookList title="Sách Đánh Giá Cao" data={topRated} handleClick={handleClick} />
      </ScrollView>
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
    fontSize: 30,
    fontWeight: 'bold',
  },
  logoHighlight: {
    color: '#eab308',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
});

export default HomeScreens;