import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, Dimensions } from 'react-native';
import SummaryModal from '../components/SummaryModal';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Cog6ToothIcon, BookmarkIcon as BookmarkOutline } from 'react-native-heroicons/outline';
import { BookmarkIcon as BookmarkSolid } from 'react-native-heroicons/solid';
import { useFonts } from 'expo-font';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { bookService } from '../backend/services/bookManagement';
import { WebView } from 'react-native-webview';

// Components
import BackButton from '../components/BackButton';
import FloatingActionButton from '../components/FloatingActionButton';

export default function ReadBookScreen() {
  // Load fonts
  const [fontsLoaded] = useFonts({
    'Mono': require('../assets/fonts/SpaceMono-Regular.ttf'),
    'Black': require('../assets/fonts/Roboto-Black.ttf'),
  });

  const params = useLocalSearchParams();
  const { id } = params;
  const [bookContent, setBookContent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const scrollViewRef = useRef(null);
  const [totalPages, setTotalPages] = useState(1);
  const [showSummary, setShowSummary] = useState(false);
  const [error, setError] = useState(null);

  // PDF states
  const [isPDF, setIsPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  // Settings states
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontFamily, setFontFamily] = useState('System');

  const webViewRef = useRef(null);

  const fonts = [
    { label: 'Mặc định', value: 'System' },
    { label: 'Mono', value: 'Mono' },
    { label: 'Black', value: 'Black' },
  ];

  useEffect(() => {
    fetchBookContent();
    detectAndDecodeContent();
    loadBookmark();
    updateReadingProgress();
  }, [id]);

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      const result = await bookService.getBooks();
      
      if (result.success && result.data[id]) {
        const bookData = result.data[id];
        const chaptersArray = bookData.chapters ? 
          Object.entries(bookData.chapters).map(([chapterId, chapter]) => ({
            id: chapterId,
            title: chapter.name,
            content: chapter.content,
            orderindex: chapter.orderindex
          })).sort((a, b) => a.orderindex - b.orderindex) : 
          [];
  
        if (chaptersArray.length === 0) {
          chaptersArray.push({
            id: 1,
            title: "Chương 1",
            content: "Không có nội dung"
          });
        }
        
        // Fetch và xử lý content
        for (let chapter of chaptersArray) {
  if (chapter.content && chapter.content.startsWith('http')) {
    try {
      const response = await fetch(chapter.content);
      const contentType = response.headers.get('content-type');

      if (contentType?.includes('text/plain') || chapter.content.endsWith('.txt')) {
        const text = await response.text();
        chapter.content = detectAndDecodeContent(text);
      } else if (contentType?.includes('application/pdf')) {
        setIsPDF(true);
        setPdfUrl(chapter.content);
        chapter.content = "Đang mở PDF viewer...";
      } else {
        chapter.content = "Không hỗ trợ định dạng này.";
      }
    } catch (error) {
      console.error('Error fetching chapter content:', error);
      chapter.content = "Không thể tải nội dung chương này";
    }
  }
}
  
        setBookContent({
          title: bookData.name,
          chapters: chaptersArray
        });
        
      } else {
        setError("Không thể tải nội dung sách");
      }
    } catch (error) {
      console.error('Error fetching book content:', error);
      setError("Đã xảy ra lỗi khi tải nội dung sách");
    } finally {
      setLoading(false);
    }
  };
    
  const detectAndDecodeContent = (text) => {
    try {
      return new TextDecoder('utf-8').decode(
        new TextEncoder().encode(text)
      );
    } catch {
      try {
        return decodeURIComponent(escape(text));
      } catch {
        return text;
      }
    }
  };

  const updateReadingProgress = async () => {
    try {
      await bookService.updateBook(id, {
        lastRead: Date.now(),
        currentPage: currentPage,
      });
    } catch (error) {
      console.error('Error updating reading progress:', error);
    }
  };

  const handleScroll = (event) => {
    const offset = event.nativeEvent.contentOffset.y;
    const height = event.nativeEvent.layoutMeasurement.height;
    const contentHeight = event.nativeEvent.contentSize.height;
    
    const total = Math.ceil(contentHeight / height);
    setTotalPages(total);
    
    const current = Math.ceil((offset + height) / height);
    setCurrentPage(current);

    const timeoutId = setTimeout(() => {
      updateReadingProgress();
    }, 500);

    return () => clearTimeout(timeoutId);
  };

  const toggleBookmark = async () => {
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);

      const bookmarkData = {
        bookId: id,
        page: currentPage,
        scrollPosition: scrollViewRef.current?.scrollOffset,
        timestamp: Date.now()
      };

      if (newBookmarkState) {
        await saveBookmark(bookmarkData);
        await bookService.updateBook(id, {
          bookmarked: true,
          bookmarkData
        });
      } else {
        await AsyncStorage.removeItem(`bookmark_${id}`);
        await bookService.updateBook(id, {
          bookmarked: false,
          bookmarkData: null
        });
      }
    } catch (error) {
      console.error('Error toggling bookmark:', error);
      Alert.alert("Lỗi", "Không thể cập nhật bookmark");
    }
  };

  const saveBookmark = async (bookmarkData) => {
    try {
      await AsyncStorage.setItem(
        `bookmark_${bookmarkData.bookId}`,
        JSON.stringify(bookmarkData)
      );
    } catch (error) {
      console.error('Error saving bookmark:', error);
      throw error;
    }
  };

  const loadBookmark = async () => {
    try {
      const localBookmark = await AsyncStorage.getItem(`bookmark_${id}`);
      const bookResult = await bookService.getBooks();
      const bookData = bookResult.success ? bookResult.data[id] : null;
      
      if (bookData?.bookmarked || localBookmark) {
        setIsBookmarked(true);
        const bookmarkData = bookData?.bookmarkData || JSON.parse(localBookmark);
        
        if (bookmarkData?.scrollPosition && !isPDF) {
          scrollViewRef.current?.scrollTo({
            y: bookmarkData.scrollPosition,
            animated: false
          });
        }
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
  };

  const handleAudioBook = () => {
    Alert.alert("Thông báo", "Tính năng sách nói đang được phát triển");
  };

  const handleAISummary = () => {
    if (!bookContent) {
      Alert.alert(
        "Thông báo",
        "Không thể tạo tóm tắt khi chưa có nội dung sách.",
        [{ text: "OK" }]
      );
      return;
    }
    setShowSummary(true);
  };

  if (!fontsLoaded) {
    return null;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <BackButton />
          <View style={styles.headerRight}>
            <TouchableOpacity 
              onPress={toggleBookmark}
              style={styles.headerButton}
            >
              {isBookmarked ? (
                <BookmarkSolid size={24} color="#3B82F6" />
              ) : (
                <BookmarkOutline size={24} color="black" />
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={() => setShowSettings(true)}
              style={styles.headerButton}
            >
              <Cog6ToothIcon size={24} color="black" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Indicator */}
        {!isPDF && (
          <View style={styles.pageIndicator}>
            <Text style={styles.pageText}>
              Trang {currentPage}/{totalPages}
            </Text>
          </View>
        )}

        {/* Content */}
        {isPDF ? (
        <View style={styles.pdfContainer}>
            {webViewLoading && (
            <View style={[styles.loadingContainer, { position: 'absolute', zIndex: 1, width: '100%', height: '100%' }]}>
                <Text>Đang tải PDF...</Text>
            </View>
            )}
            <WebView
            source={{
                uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`,
            }}
            style={styles.webview}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.warn('WebView error: ', nativeEvent);
                Alert.alert(
                "Lỗi",
                "Không thể tải file PDF. Bạn có muốn thử tải lại không?",
                [
                    {
                    text: "Hủy",
                    style: "cancel"
                    },
                    { 
                    text: "Tải lại", 
                    onPress: () => {
                        // Reset WebView
                        setWebViewLoading(true);
                        webViewRef.current?.reload();
                    }
                    }
                ]
                );
            }}
            ref={webViewRef}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            bounces={false}
            showsHorizontalScrollIndicator={false}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            // Thêm gesture zoom
            injectedJavaScript={`
                document.addEventListener('gesturestart', function(e) {
                e.preventDefault();
                });
            `}
            />
        </View>
        ) : (
          <ScrollView 
            ref={scrollViewRef}
            style={styles.content}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          >
            {loading ? (
              <View style={styles.loadingContainer}>
                <Text>Đang tải nội dung...</Text>
              </View>
            ) : (
              <View style={styles.bookContent}>
                {bookContent?.chapters.map((chapter) => (
                  <View key={chapter.id} style={styles.chapter}>
                    <Text style={[
                      styles.chapterTitle,
                      { fontFamily: fontFamily === 'System' ? undefined : fontFamily }
                    ]}>
                      {chapter.title}
                    </Text>
                    <Text style={[
                      styles.chapterContent,
                      {
                        fontSize: fontSize,
                        lineHeight: fontSize * lineHeight,
                        fontFamily: fontFamily === 'System' ? undefined : fontFamily
                      }
                    ]}>
                      {chapter.content}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>
        )}

        {/* Settings Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={showSettings}
          onRequestClose={() => setShowSettings(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Cài đặt hiển thị</Text>
              
              {/* Font Size Settings */}
              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Cỡ chữ</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setFontSize(prev => Math.max(12, prev - 2))}
                  >
                    <Text>A-</Text>
                  </TouchableOpacity>
                  <Text>{fontSize}</Text>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setFontSize(prev => Math.min(24, prev + 2))}
                  >
                    <Text>A+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Line Height Settings */}
            <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Khoảng cách dòng</Text>
                <View style={styles.settingControls}>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setLineHeight(prev => Math.max(1, prev - 0.1))}
                  >
                    <Text>-</Text>
                  </TouchableOpacity>
                  <Text>{lineHeight.toFixed(1)}</Text>
                  <TouchableOpacity 
                    style={styles.controlButton}
                    onPress={() => setLineHeight(prev => Math.min(2, prev + 0.1))}
                  >
                    <Text>+</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Font Family Settings */}
              <View style={styles.settingSection}>
                <Text style={styles.settingLabel}>Font chữ</Text>
                <View style={styles.fontFamilyContainer}>
                  {fonts.map((font) => (
                    <TouchableOpacity 
                      key={font.value}
                      style={[
                        styles.fontButton,
                        fontFamily === font.value && styles.selectedFont
                      ]}
                      onPress={() => setFontFamily(font.value)}
                    >
                      <Text style={[
                        styles.fontButtonText,
                        fontFamily === font.value && styles.selectedFontText
                      ]}>
                        {font.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowSettings(false)}
              >
                <Text style={styles.closeButtonText}>Đóng</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Summary Modal */}
        {showSummary && (
          <SummaryModal 
            visible={showSummary}
            onClose={() => setShowSummary(false)}
            bookContent={bookContent}
          />
        )}
      </SafeAreaView>
      
      {/* Floating Action Button */}
      <FloatingActionButton 
        onAudioBook={handleAudioBook}
        onAISummary={handleAISummary}
      />
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  headerButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
  bookContent: {
    gap: 24,
  },
  chapter: {
    gap: 16,
  },
  chapterTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  chapterContent: {
    color: '#4B5563',
  },
  pageIndicator: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    zIndex: 10,
  },
  pageText: {
    color: 'white',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    fontSize: 16,
    marginBottom: 10,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  controlButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    minWidth: 40,
    alignItems: 'center',
  },
  fontFamilyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  fontButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E5E7EB',
    minWidth: 100,
    alignItems: 'center',
  },
  selectedFont: {
    backgroundColor: '#3B82F6',
  },
  fontButtonText: {
    color: 'black',
  },
  selectedFontText: {
    color: 'white',
  },
  closeButton: {
    marginTop: 20,
    backgroundColor: '#3B82F6',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  closeButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pdfContainer: {
    flex: 1,
    height: Dimensions.get('window').height - 100,
    backgroundColor: '#F5F5F5',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
});