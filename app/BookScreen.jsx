import { View, Text, ScrollView, TouchableOpacity, Dimensions, Platform, Image, StyleSheet } from 'react-native';
import React, { useState, useEffect } from 'react';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HeartIcon, ArrowDownTrayIcon, EllipsisHorizontalIcon, ShareIcon } from 'react-native-heroicons/outline';
import { StarIcon } from 'react-native-heroicons/solid';
import BackButton from '../components/BackButton';
import { bookService } from '../backend/services/bookManagement';
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
const [authors, setAuthors] = useState([]);


  useEffect(() => {
    console.log("Book ID from params:", params.id);
    fetchBookDetails();
  }, [params.id]);

  const fetchBookDetails = async () => {
    try {
      const bookRef = await bookService.getBooks();
      // Ensure bookRef.data is valid and an object
      if (bookRef && bookRef.data) {
        const bookData = bookRef.data[params.id];
        if (bookData) {
          // Format book data
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
      const storage = getStorage(); // Initialize Firebase Storage
      const fileRef = ref(storage, fileUrl);
      const url = await getDownloadURL(fileRef); // Get the download URL

      // Fetch the content from the file
      const response = await fetch(url);
      const text = await response.text(); // Read the file content
      setDescription(text); // Update the state with description content
    } catch (error) {
      console.error("Error fetching description:", error);
    }
  };

  const toggleDescription = () => {
  setIsExpanded(!isExpanded);
};

  const handleFavorite = async () => {
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
    }
  };

  const handleDownload = async () => {
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
      // Thêm logic tải sách ở đây
    } catch (error) {
      console.error("Error updating downloads:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = async () => {
    try {
      // Thêm logic chia sẻ sách
      await bookService.updateBook(params.id, {
        shares: (book?.shares || 0) + 1
      });
      setBook(prev => ({
        ...prev,
        shares: (prev.shares || 0) + 1
      }));
    } catch (error) {
      console.error("Error sharing book:", error);
    }
  };

  const handleReadBook = () => {
    // Cập nhật lượt xem trước khi chuyển trang
    try {
      bookService.updateBook(params.id, {
        view: (book?.view || 0) + 1
      });
      router.push({
        pathname: "/ReadBookScreen",
        params: {
          id: params.id,
          title: book.title,
          content: book.content
        }
      });
    } catch (error) {
      console.error("Error updating view count:", error);
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
      {/* Background Image with Blur */}
      <Image 
        source={{ uri: book.image }}
        style={styles.backgroundImage}
        blurRadius={5}
      />
      <View style={styles.gradientOverlay} />

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <SafeAreaView style={styles.header}>
          <BackButton style={styles.headerIcon} />
          <TouchableOpacity onPress={handleShare}>
            <ShareIcon size={24} color="#FFF" style={styles.headerIcon} />
          </TouchableOpacity>
        </SafeAreaView>

        {/* Book Content */}
        <View style={styles.content}>
          {/* Cover Image */}
          <Image 
            source={{ uri: book.image }}
            style={styles.coverImage}
            resizeMode="contain"
          />

          {/* Book Details */}
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

            {/* Rating Section */}
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

            {/* Stats Section */}
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

            {/* Action Buttons */}
            <TouchableOpacity 
              style={styles.readButton}
              onPress={handleReadBook}
            >
              <Text style={styles.readButtonText}>ĐỌC SÁCH</Text>
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

            {/* Categories */}
            <View style={styles.categories}>
              {Array.isArray(book.categories) && book.categories.map((category, index) => (
                <TouchableOpacity key={index} style={styles.categoryTag}>
                  <Text style={styles.categoryText}>{category}</Text>
                </TouchableOpacity>
              ))}
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


            {/* Additional Info */}
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
    alignItems: 'center',
    marginTop: 24,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    textAlign: 'center',
  },
  authorsContainer: {
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
    marginTop: 16,
    gap: 8,
  },
  stars: {
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
    marginTop: 20,
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
    marginTop: 24,
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
    marginTop: 24,
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
    justifyContent: 'center',
    gap: 10,
    marginTop: 24,
  },
  categoryTag: {
    backgroundColor: '#333',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  categoryText: {
    color: '#FFF',
    fontSize: 14,
  },
  description: {
    width: '100%',
    marginTop: 10,
  },
  descriptionTitle: {
    fontSize: 20,
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
  marginTop: 32,
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