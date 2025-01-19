import { View, Text, TouchableOpacity, Image, StyleSheet, Dimensions } from 'react-native';
import Carousel from 'react-native-reanimated-carousel';
import { router } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { 
  useAnimatedStyle, 
  interpolate, 
  useSharedValue,
  withSpring 
} from 'react-native-reanimated';
import React, { useEffect, useState } from 'react';
import { get, ref } from 'firebase/database';
import { database } from '../backend/firebase/FirebaseConfig';  // Import Firebase config

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH * 0.6;
const CARD_HEIGHT = CARD_WIDTH * 1.6;

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const MovieCard = ({ item, handleClick, index, animationValue }) => {
  if (!item) return null;

  const cardStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      animationValue.value,
      [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        (index + 1) * CARD_WIDTH,
      ],
      [0.9, 1, 0.9]
    );

    const opacity = interpolate(
      animationValue.value,
      [
        (index - 1) * CARD_WIDTH,
        index * CARD_WIDTH,
        (index + 1) * CARD_WIDTH,
      ],
      [0.75, 1, 0.75]
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <AnimatedTouchable 
      onPress={() => handleClick(item)} 
      style={[styles.cardContainer, cardStyle]}
    >
      <Image
        source={item.image ? { uri: item.image } : require('../assets/images/books/6.png')}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.textContainer}>
          <Text style={styles.title} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.author} numberOfLines={1}>{item.author}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Lượt xem</Text>
              <Text style={styles.statValue}>{item.view || 0}</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>Đánh giá</Text>
              <Text style={styles.statValue}>{item.totalrating || 0}⭐</Text>
            </View>
          </View>
        </View>
      </View>
    </AnimatedTouchable>
  );
};

const fetchTrendingBooks = async () => {
  try {
    const booksRef = ref(database, 'books');
    const snapshot = await get(booksRef);

    if (snapshot.exists()) {
      const books = Object.entries(snapshot.val()).map(([id, book]) => ({
        id,
        ...book,
      }));

      // Lọc sách trending: Giả sử sách trending là những sách có lượt xem >= 100
      const trendingBooks = books.filter(book => book.view >= 100);

      // Sắp xếp sách theo lượt xem giảm dần (hoặc theo đánh giá)
      trendingBooks.sort((a, b) => b.view - a.view);

      setData(trendingBooks);  // Cập nhật dữ liệu trending sách
    } else {
      console.log('No trending books found');
    }
  } catch (error) {
    console.error('Error fetching books:', error);
  }

    fetchTrendingBooks();
  }, []);

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
    <GestureHandlerRootView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>Trending</Text>
        <TouchableOpacity 
          style={styles.viewAllButton}
          onPress={() => router.push('/TrendingScreen')}
        >
          <Text style={styles.viewAllText}>Xem tất cả</Text>
        </TouchableOpacity>
      </View>
      <Carousel
        loop
        width={CARD_WIDTH}
        height={CARD_HEIGHT}
        data={data}
        scrollAnimationDuration={1000}
        onProgressChange={(_, absoluteProgress) => {
          animationValue.value = withSpring(absoluteProgress * CARD_WIDTH);
        }}
        renderItem={({ item, index }) => (
          <MovieCard 
            item={item} 
            handleClick={handleClick} 
            index={index}
            animationValue={animationValue}
          />
        )}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 30,
        }}
        style={styles.carousel}
        panGestureHandlerProps={{
          activeOffsetX: [-10, 10],
          failOffsetY: [-5, 5],
        }}
        snapEnabled={true}
        defaultIndex={0}
      />
    </GestureHandlerRootView>
  );
};


const styles = StyleSheet.create({
  container: {
    paddingVertical: 16,
    backgroundColor: 'transparent',
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
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 16,
  },
  cardContainer: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#1e1e1e',
    elevation: 5,
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
    height: CARD_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  }
});

export default TrendingBooks;