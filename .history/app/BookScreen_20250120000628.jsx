import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform, Image, StyleSheet, Alert } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeartIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon, ShareIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';
import BackButton from '../components/BackButton';
import { bookService } from '../backend/services/bookManagement';
import { readingService } from '../backend/services/readingService';
import { auth } from '../backend/firebase/FirebaseConfig';
import { getStorage, ref, getDownloadURL } from 'firebase/storage'; 

const {width, height} = Dimensions.get('window');
const ios = Platform.OS == 'ios';

export default function BookScreen() {
  const params = useLocalSearchParams();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [description, setDescription] = useState(""); // State for description
  const [isExpanded, setIsExpanded] = useState(false);
  const [isReadingLoading, setIsReadingLoading] = useState(false);
  const [authors, setAuthors] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    console.log("Book ID from params:", params.id);
    fetchBookDetails();
  }, [params.id]);

  const fetchBookDetails = async () => {
    try {
      const bookRef = await bookService.getBooks();
      if (bookRef && bookRef.data) {
        const bookData = bookRef.data[params.id];
        if (bookData) {
          const formattedBook = {
            ...bookData,
            id: params.id,
            view: bookData.view || 0,
            downloads: bookData.downloads || 0,
            favoriteCount: bookData.favoriteCount || 0,
            rating: bookData.rating || 0,
            categories: bookData.categories || [],
            descriptionFile: bookData.description,
            authors: bookData.authors || [],
          };
          setBook(formattedBook);
          fetchAuthors(bookData.authors);
          fetchCategories(bookData.categories);
          if (bookData.description) {
            fetchDescription(bookData.description);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching book details:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async (categoryIds) => {
    try {
      const categoryList = [];
      for (const categoryId of categoryIds) {
        const category = await bookService.getCategoryById(categoryId);
        if (category && category.data && category.data.name) {
          categoryList.push(category.data);
        }
      }
      setCategories(categoryList);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchAuthors = async (authorIds) => {
    try {
      const authorList = [];
      for (const authorId of authorIds) {
        const author = await bookService.getAuthorById(authorId);
        if (author && author.data && author.data.name) {
          authorList.push(author.data);
        }
      }
      setAuthors(authorList);
    } catch (error) {
      console.error("Error fetching authors:", error);
    }
  };

  const fetchDescription = async (fileUrl) => {
    try {
      const storage = getStorage();
      const fileRef = ref(storage, fileUrl);
      const url = await getDownloadURL(fileRef);
      const response = await fetch(url);
      const text = await response.text();
      setDescription(text);
    } catch (error) {
      console.error("Error fetching description:", error);
    }
  };

  const toggleDescription = () => {
    setIsExpanded(!isExpanded);
  };

  const handleFavorite = async () => {
    if (!auth.currentUser) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để thêm vào yêu thích", [
        { text: "Đăng nhập", onPress: () => router.push('/Login') },
        { text: "Hủy", style: "cancel" },
      ]);
      return;
    }
    try {
      await bookService.updateBook(params.id, {
        favorite: !book?.favorite,
        favoriteCount: (book?.favoriteCount || 0) + (book?.favorite ? -1 : 1),
      });
      setBook((prev) => ({
        ...prev,
        favorite: !prev.favorite,
        favoriteCount: prev.favoriteCount + (prev.favorite ? -1 : 1),
      }));
    } catch (error) {
      console.error("Error updating favorite:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích");
    }
  };

  const handleDownload = async () => {
    if (!auth.currentUser) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để tải sách", [
        { text: "Đăng nhập", onPress: () => router.push('/Login') },
        { text: "Hủy", style: "cancel" },
      ]);
      return;
    }

    if (downloading) return;

    try {
      setDownloading(true);
      await bookService.updateBook(params.id, {
        downloads: (book?.downloads || 0) + 1,
      });
      setBook((prev) => ({
        ...prev,
        downloads: (prev.downloads || 0) + 1,
      }));
      Alert.alert("Thành công", "Sách đã được tải xuống");
    } catch (error) {
      console.error("Error updating downloads:", error);
      Alert.alert("Lỗi", "Không thể tải sách");
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      await bookService.updateBook(params.id, {
        shares: (book?.shares || 0) + 1,
      });
      setBook((prev) => ({
        ...prev,
        shares: (prev.shares || 0) + 1,
      }));
      Alert.alert("Thành công", "Đã chia sẻ sách");
    } catch (error) {
      console.error("Error sharing book:", error);
      Alert.alert("Lỗi", "Không thể chia sẻ sách");
    }
  };

  const handleReadBook = async () => {
    if (!auth.currentUser) {
      Alert.alert("Thông báo", "Bạn cần đăng nhập để đọc sách", [
        { text: "Đăng nhập", onPress: () => router.push('/Login') },
        { text: "Hủy", style: "cancel" },
      ]);
      return;
    }

    setIsReadingLoading(true);
    try {
      await bookService.updateBook(params.id, {
        view: (book?.view || 0) + 1,
      });

      const result = await readingService.addToReading(params.id);
      if (!result.success) {
        Alert.alert("Lỗi", "Không thể thêm sách vào danh sách đang đọc. Vui lòng thử lại sau.", [
          { text: "OK" },
        ]);
        return;
      }

      setBook((prev) => ({
        ...prev,
        view: (prev?.view || 0) + 1,
        lastRead: Date.now(),
      }));

      router.push({
        pathname: "/ReadBookScreen",
        params: {
          id: params.id,
          title: book.name,
          content: book.chapters.chapterId1.content,
        },
      });
    } catch (error) {
      console.error("Lỗi khi bắt đầu đọc sách:", error);
      Alert.alert("Lỗi", "Đã có lỗi xảy ra khi truy cập sách. Vui lòng thử lại sau.", [
        { text: "OK" },
      ]);
    } finally {
      setIsReadingLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Đang tải...</Text>
      </View>
    );
  }

  if (!book) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Không tìm thấy sách</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image source={{ uri: book.image }} style={styles.backgroundImage} blurRadius={5} />
      <View style={styles.gradientOverlay} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <SafeAreaView style={styles.header}>
          <BackButton style={styles.headerIcon} />
          <TouchableOpacity onPress={handleShare}>
            <ShareIcon size={24} color="#FFF" />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.bookContent}>
          <Image source={{ uri: book.image }} style={styles.bookImage} />

          <View style={styles.bookDetails}>
            <Text style={styles.bookTitle}>{book.name}</Text>
            <Text style={styles.bookSubTitle}>{book.subName}</Text>

            <View style={styles.ratingContainer}>
              <StarIcon size={16} color="#FFC700" />
              <Text style={styles.ratingText}>{book.rating}</Text>
            </View>

            <TouchableOpacity onPress={toggleDescription} style={styles.descriptionToggle}>
              <Text style={styles.descriptionToggleText}>
                {isExpanded ? "Thu gọn" : "Xem thêm"}
              </Text>
            </TouchableOpacity>

            {isExpanded && <Text style={styles.description}>{description}</Text>}

            <View style={styles.actions}>
              <TouchableOpacity onPress={handleFavorite} style={styles.favoriteButton}>
                <HeartIcon size={24} color={book.favorite ? "#F00" : "#FFF"} />
                <Text style={styles.favoriteCount}>{book.favoriteCount}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleDownload} style={styles.downloadButton}>
                <ArrowDownTrayIcon size={24} color="#FFF" />
                <Text style={styles.downloadCount}>{book.downloads}</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.categoryContainer}>
            {categories.map((category) => (
              <Text key={category.id} style={styles.category}>{category.name}</Text>
            ))}
          </View>

          <TouchableOpacity onPress={handleReadBook} style={styles.readButton}>
            <Text style={styles.readButtonText}>
              {isReadingLoading ? "Đang mở..." : "Đọc sách"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollView: { flex: 1, paddingHorizontal: 16 },
  backgroundImage: { width, height: height / 2, position: 'absolute' },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height / 2,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', padding: 16 },
  headerIcon: { paddingTop: 16 },
  bookContent: { marginTop: height / 2 - 30, backgroundColor: '#FFF', borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  bookImage: { width: 120, height: 180, borderRadius: 8, marginTop: -40, marginLeft: 16 },
  bookDetails: { marginLeft: 160, marginTop: 10 },
  bookTitle: { fontSize: 22, fontWeight: 'bold', color: '#000' },
  bookSubTitle: { fontSize: 16, color: '#555', marginTop: 4 },
  ratingContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 8 },
  ratingText: { fontSize: 14, marginLeft: 4, color: '#555' },
  descriptionToggle: { marginTop: 8 },
  descriptionToggleText: { color: '#0057D9' },
  description: { marginTop: 10, color: '#333' },
  actions: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 16 },
  favoriteButton: { flexDirection: 'row', alignItems: 'center' },
  favoriteCount: { color: '#FFF', marginLeft: 8 },
  downloadButton: { flexDirection: 'row', alignItems: 'center' },
  downloadCount: { color: '#FFF', marginLeft: 8 },
  categoryContainer: { flexDirection: 'row', marginTop: 16 },
  category: { fontSize: 14, color: '#0057D9', marginRight: 8 },
  readButton: {
    backgroundColor: '#0057D9',
    paddingVertical: 12,
    marginTop: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  readButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  loadingContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  loadingText: { fontSize: 18 },
  errorContainer: { justifyContent: 'center', alignItems: 'center', flex: 1 },
  errorText: { fontSize: 18, color: 'red' },
});
