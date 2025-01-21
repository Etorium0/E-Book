import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { router } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { get, ref } from 'firebase/database';
import { database } from '../backend/firebase/FirebaseConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PAGE_WIDTH = SCREEN_WIDTH * 0.5;
const PAGE_HEIGHT = PAGE_WIDTH * 1.6;

const MovieCard = ({ item, handleClick }) => {
  if (!item) return null;

  return (
    <View style={styles.cardContainer}>
      <TouchableOpacity 
        onPress={() => handleClick?.(item)}
        style={styles.touchable}
      >
        <Image
          source={item.image ? { uri: item.image } : require('../assets/images/books/6.png')}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.overlay}>
          <View style={styles.textContainer}>
            <Text style={styles.title} numberOfLines={2}>{item.name || 'Không có tiêu đề'}</Text>
            <Text style={styles.author} numberOfLines={1}>{item.author || 'Không có tác giả'}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Lượt xem</Text>
                <Text style={styles.statValue}>{item.view || 0}</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Đánh giá</Text>
                <Text style={styles.statValue}>{item.rating || 0}⭐</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
};

const TrendingBooks = ({ handleClick }) => {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchTrendingBooks = async () => {
      try {
        setIsLoading(true);
        const booksRef = ref(database, 'books');
        const snapshot = await get(booksRef);

        if (snapshot.exists()) {
          const books = Object.entries(snapshot.val())
            .map(([id, book]) => ({
              id,
              ...book,
            }))
            .filter(book => (book.view || 0) >= 1000)
            .sort((a, b) => (b.view || 0) - (a.view || 0))
            .slice(0, 5);

          setData(books);
        }
      } catch (error) {
        console.error('Error fetching books:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTrendingBooks();
  }, []);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>Trending</Text>
          <TouchableOpacity 
            style={styles.viewAllButton}
            onPress={() => router.push('/TrendingScreen')}
          >
            <Text style={styles.viewAllText}>Xem tất cả</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Không có sách trending</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Trending</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/TrendingScreen')}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.carouselContainer}>
        <Carousel
          loop
          autoPlay={false}
          width={PAGE_WIDTH}
          height={PAGE_HEIGHT}
          data={data}
          scrollAnimationDuration={500}
          renderItem={({ item }) => (
            <MovieCard 
              key={item.id}
              item={item} 
              handleClick={handleClick}
            />
          )}
          defaultIndex={0}
          enabled={true}
          style={styles.carousel}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: 'transparent',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: PAGE_HEIGHT,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
  },
  viewAllButton: {
    padding: 8,
  },
  viewAllText: {
    color: '#eab308',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    height: PAGE_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  loadingText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  touchable: {
    width: '100%',
    height: '100%',
  },
  cardContainer: {
    width: PAGE_WIDTH - 30,
    height: PAGE_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    elevation: 5,
    marginHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  textContainer: {
    gap: 6,
  },
  title: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  author: {
    color: '#9CA3AF',
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginBottom: 2,
  },
  statValue: {
    color: '#D1D5DB',
    fontSize: 14,
    fontWeight: '600',
  },
  carousel: {
    width: '100%',
    height: PAGE_HEIGHT,
  },
  carouselContainer: {
    height: PAGE_HEIGHT,
  }
});

export default TrendingBooks;