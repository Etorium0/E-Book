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
  container: {
    flex: 1,
    backgroundColor: '#1A1A1A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 18,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
  },
  errorText: {
    color: '#FFF',
    fontSize: 18,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height * 1.2,
    opacity: 0.5,
  },
  gradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    width: width,
    height: height * 1.2,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: ios ? 0 : 16,
  },
  headerIcon: {
    padding: 8,
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  coverImage: {
    width: width * 0.6,
    height: height * 0.35,
    borderRadius: 12,
    marginTop: 20,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  detailsContainer: {
    width: '100%',
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  authorsContainer: {
     alignItems: 'center',
    marginVertical: 16,
  },
  authorsTitle: {
    fontSize: 16,
    color:'#fff'
  },
  authorName: {
    fontSize: 16,
    color: '#999',
  },

  ratingSection: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 0,
    gap: 8,
  },
  stars: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
  },
  ratingText: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: 5,
    paddingHorizontal: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#999',
    fontSize: 14,
    marginTop: 4,
  },
  readButton: {
    backgroundColor: '#A2B2FC',
    width: '100%',
    paddingVertical: 16,
    borderRadius: 30,
    marginTop: 10,
  },
  readButtonDisabled: {
    opacity: 0.7,
    backgroundColor: '#808080',
  },
  readButtonText: {
    color: '#FFF',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    textTransform: 'uppercase',
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
    marginTop: 10,
  },
  iconButton: {
    backgroundColor: '#333',
    padding: 12,
    borderRadius: 50,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  categories: {
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'flex-start',
  gap: 10,
  marginTop: 10,
},
categoryName: {
  backgroundColor: 'rgba(0, 0, 0, 0.25)', // Nền trong suốt với độ mờ
  paddingHorizontal: 15,
  paddingVertical: 5,
  borderRadius: 20,
  color: '#fff',
  borderColor: 'gray',
  borderWidth: 0.5,
  flex: 0, // Không cố định chiều rộng
  alignSelf: 'flex-start', // Căn trái
},
  description: {
    width: '100%',
    marginTop: 0,
  },
  descriptionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 12,
  },
  descriptionText: {
    color: '#999',
    fontSize: 16,
    lineHeight: 24,
  },
  additionalInfo: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingHorizontal: 20,
  },
  infoLabel: {
    color: '#999',
    fontSize: 14,
  },
  description: {
  width: '100%',
  marginTop: 10,
  paddingHorizontal:0,  // Padding around the text
},
descriptionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  color: '#FFF',
  marginBottom: 12,
},
descriptionText: {
  color: '#fff',
  fontSize: 16,
  lineHeight: 24,
},
showMoreText: {
  color: '#999',
  fontSize: 16,
  fontWeight: 'bold',
  textAlign: 'center',
  marginTop: 8, // Adjust space above the "Xem thêm" text
},
  infoValue: {
    color: '#FFF',
    fontSize: 14,
  }
});