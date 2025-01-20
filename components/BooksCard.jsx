import React from 'react';
import { View, Text, Image, StyleSheet, Dimensions } from 'react-native';

const { width, height } = Dimensions.get('window');

const BookCard = ({ item }) => {
  const authorNames = item.authors ? Object.values(item.authors) : [];

  return (
    <View style={styles.bookContainer}>
      <Image
        source={
          item.image
            ? { uri: item.image }
            : require('../assets/images/books/3.png') // Hình ảnh mặc định
        }
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

const styles = StyleSheet.create({
  bookContainer: {
    width: (width - 64) / 3, // Chiều rộng cho 3 cột
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
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

export default BookCard;
