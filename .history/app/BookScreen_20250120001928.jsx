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
            authors: bookData.authors || [], // Assuming description is a file URL
          };
          setBook(formattedBook);
          fetchAuthors(bookData.authors);
          fetchCategories(bookData.categories);
          // Fetch description from Firebase Storage if exists
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
    console.log("Categories IDs:", categoryIds);
  try {
    const categoryList = [];
    for (const categoryId in categoryIds) { // Nếu categoryIds là mảng
      const category = await bookService.getCategoryById(categoryId);
      console.log("Category fetched:", category);
      if (category && category.data && category.data.name) {
        categoryList.push(category.data);
      } else {
        console.log("Tên thể loại bị thiếu hoặc không tồn tại cho ID:", categoryId);
      }
    }
    setCategories (categoryList);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin thể loại:", error);
  }
};
   const fetchAuthors = async (authorIds) => {
  console.log("Author IDs:", authorIds);  // In ra authorIds để kiểm tra
  try {
    const authorList = [];
    for (const authorId in authorIds) {
      if (authorIds[authorId]) {
        const author = await bookService.getAuthorById(authorId);
        console.log("Author object:", author);  // Kiểm tra đối tượng tác giả
        if (author && author.data && author.data.name) {  // Kiểm tra trường name trong data
          authorList.push(author.data);  // Đảm bảo rằng bạn đang lấy đúng trường data
        } else {
          console.log("Tên tác giả bị thiếu cho ID:", authorId);
        }
      }
    }
    setAuthors(authorList);
  } catch (error) {
    console.error("Lỗi khi lấy thông tin tác giả:", error);
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
      Alert.alert(
        "Thông báo",
        "Bạn cần đăng nhập để thêm vào yêu thích",
        [
          { text: "Đăng nhập", onPress: () => router.push('/Login') },
          { text: "Hủy", style: "cancel" }
        ]
      );
      return;
    }

    try {
      await bookService.updateBook(params.id, {
        favorite: !book?.favorite,
        favoriteCount: (book?.favoriteCount || 0) + (book?.favorite ? -1 : 1)
      });
      setBook(prev => ({
        ...prev,
        favorite: !prev.favorite,
        favoriteCount: prev.favoriteCount + (prev.favorite ? -1 : 1)
      }));
    } catch (error) {
      console.error("Error updating favorite:", error);
      Alert.alert("Lỗi", "Không thể cập nhật trạng thái yêu thích");
    }
  };

  const handleDownload = async () => {
    if (!auth.currentUser) {
      Alert.alert(
        "Thông báo",
        "Bạn cần đăng nhập để tải sách",
        [
          { text: "Đăng nhập", onPress: () => router.push('/Login') },
          { text: "Hủy", style: "cancel" }
        ]
      );
      return;
    }

    if (downloading) return;

    try {
      setDownloading(true);
      await bookService.updateBook(params.id, {
        downloads: (book?.downloads || 0) + 1
      });
      setBook(prev => ({
        ...prev,
        downloads: (prev.downloads || 0) + 1
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
        shares: (book?.shares || 0) + 1
      });
      setBook(prev => ({
        ...prev,
        shares: (prev.shares || 0) + 1
      }));
      Alert.alert("Thành công", "Đã chia sẻ sách");
    } catch (error) {
      console.error("Error sharing book:", error);
      Alert.alert("Lỗi", "Không thể chia sẻ sách");
    }
  };

  const handleReadBook = async () => {
    // Kiểm tra user đã đăng nhập chưa
    if (!auth.currentUser) {
      Alert.alert(
        "Thông báo",
        "Bạn cần đăng nhập để đọc sách",
        [
          { 
            text: "Đăng nhập", 
            onPress: () => router.push('/Login')
          },
          {
            text: "Hủy",
            style: "cancel"
          }
        ]
      );
      return;
    }

    setIsReadingLoading(true);
    try {
      // Cập nhật lượt xem
      await bookService.updateBook(params.id, {
        view: (book?.view || 0) + 1
      });

      // Thêm sách vào trạng thái đang đọc
      const result = await readingService.addToReading(params.id);
      if (!result.success) {
        Alert.alert(
          "Lỗi",
          "Không thể thêm sách vào danh sách đang đọc. Vui lòng thử lại sau.",
          [{ text: "OK" }]
        );
        return;
      }

      // Cập nhật state book
      setBook(prev => ({
        ...prev,
        view: (prev?.view || 0) + 1,
        lastRead: Date.now()
      }));

      // Chuyển đến trang đọc sách
      router.push({
        pathname: "/ReadBookScreen",
        params: {
          id: params.id,
          title: book.name,
          content: book.chapters.chapterId1.content
        }
      });

    } catch (error) {
      console.error("Lỗi khi bắt đầu đọc sách:", error);
      Alert.alert(
        "Lỗi",
        "Đã có lỗi xảy ra khi truy cập sách. Vui lòng thử lại sau.",
        [{ text: "OK" }]
      );
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
      <Image 
        source={{ uri: book.image }}
        style={styles.backgroundImage}
        blurRadius={5}
      />
      <View style={styles.gradientOverlay} />

    <ScrollView 
  style={styles.scrollView} 
  showsVerticalScrollIndicator={false}
  contentContainerStyle={{ paddingBottom: 20 }} >
        <SafeAreaView style={styles.header}>
          <BackButton style={styles.headerIcon} />
          <TouchableOpacity onPress={handleShare}>
            <ShareIcon size={24} color="#FFF" style={styles.headerIcon} />
          </TouchableOpacity>
        </SafeAreaView>

        <View style={styles.content}>
          <Image 
            source={{ uri: book.image }}
            style={styles.coverImage}
            resizeMode="contain"
          />

          <View style={styles.detailsContainer}>
            <Text style={styles.title}>{book.name}</Text>
            <View style={styles.authorsContainer}>
          <Text style={styles.authorsTitle}>Tác giả: {authors.length > 0 ? authors.map((author, index) => (
      <Text key={index} style={styles.authorName}>
        {author.name}{index < authors.length - 1 ? ", " : ""}
      </Text>
    )) : " Chưa có tác giả"}
  </Text>
</View>

            <View style={styles.ratingSection}>
              <View style={styles.stars}>
                {[1,2,3,4,5].map((_, index) => (
                  <StarIcon 
                    key={index} 
                    size={16} 
                    color={index < Math.floor(book.rating || 0) ? "#FFD700" : "#666"}
                  />
                ))}
              </View>
              <Text style={styles.ratingText}>{book.rating?.toFixed(1) || "0.0"}</Text>
            </View>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{book.view || 0}</Text>
                <Text style={styles.statLabel}>Lượt xem</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{book.downloads || 0}</Text>
                <Text style={styles.statLabel}>Lượt tải</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{book.favoriteCount || 0}</Text>
                <Text style={styles.statLabel}>Yêu thích</Text>
              </View>
            </View>

            <TouchableOpacity 
              style={[
                styles.readButton,
                isReadingLoading && styles.readButtonDisabled
              ]}
              onPress={handleReadBook}
              disabled={isReadingLoading}
            >
              <Text style={styles.readButtonText}>
                {isReadingLoading ? "ĐANG XỬ LÝ..." : "ĐỌC SÁCH"}
              </Text>
            </TouchableOpacity>

            <View style={styles.actionButtons}>
              <TouchableOpacity style={styles.iconButton} onPress={handleFavorite}>
                <HeartIcon size={24} color={book.favorite ? "#FF0000" : "#FFF"} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.iconButton, downloading && styles.iconButtonDisabled]}
                onPress={handleDownload}
                disabled={downloading}
              >
                <ArrowDownTrayIcon size={24} color="#FFF" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconButton}>
                <EllipsisHorizontalIcon size={24} color="#FFF" />
              </TouchableOpacity>
            </View>


            <View style={styles.description}>
  <Text style={styles.descriptionTitle}>Giới thiệu</Text>
  <Text style={styles.descriptionText}>
    {isExpanded 
      ? description 
      : `${description.slice(0, 200)}...`}
    {description.length > 200 && (  // Show "Xem thêm" if the description is longer than 200 characters
      <Text 
        style={styles.showMoreText} 
        onPress={toggleDescription}
      >
        {isExpanded ? " Thu gọn" : " Xem thêm"}
      </Text>
    )}
  </Text>
</View>     
 <View style={styles.categories}>
  {categories.length > 0 ? (
    categories.map((category, index) => (
      <Text key={index} style={styles.categoryName}>
        {category.name}
        {index < categories.length - 1 ? " " : ""}
      </Text>
    ))
  ) : (
    <Text>Chưa có tác giả</Text>
  )}
</View>


            {book.publishDate && (
              <View style={styles.additionalInfo}>
                <Text style={styles.infoLabel}>Ngày xuất bản:</Text>
                <Text style={styles.infoValue}>
                  {new Date(book.publishDate).toLocaleDateString('vi-VN')}
                </Text>
              </View>
            )}
            {book.publisher && (
              <View style={styles.additionalInfo}>
                <Text style={styles.infoLabel}>Nhà xuất bản:</Text>
                <Text style={styles.infoValue}>{book.publisher}</Text>
              </View>
            )}
          </View>
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
  scrollView: {
  flex: 1,
  paddingBottom: 100, // Tạo thêm khoảng không ở dưới
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
