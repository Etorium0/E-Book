import { View, Text, ScrollView, TouchableOpacity, Modal, StyleSheet, Alert, Dimensions, ActivityIndicator } from 'react-native';
import React, { useState, useEffect, useRef } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Speech from 'expo-speech';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Slider from '@react-native-community/slider';
import { WebView } from 'react-native-webview';
import { 
  PlayIcon, 
  PauseIcon,
  BookmarkIcon as BookmarkOutline,
  Cog6ToothIcon,
  DocumentTextIcon 
} from 'react-native-heroicons/outline';
import { BookmarkIcon as BookmarkSolid } from 'react-native-heroicons/solid';
import { bookService } from '../backend/services/bookManagement';
import { generateSummary } from '../services/geminiService';

// Components
import BackButton from '../components/BackButton';

export default function AudioScreen() {
  const params = useLocalSearchParams();
  const { id } = params;
  
  // Content states
  const [bookContent, setBookContent] = useState(null);
  const [currentChapter, setCurrentChapter] = useState(0);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [sentences, setSentences] = useState([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Settings states
  const [showSettings, setShowSettings] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState(null);
  const [availableVoices, setAvailableVoices] = useState([]);
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF and file states
  const [isPDF, setIsPDF] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [webViewLoading, setWebViewLoading] = useState(true);

  // Summary states
  const [showSummary, setShowSummary] = useState(false);
  const [summary, setSummary] = useState('');
  const [loadingSummary, setLoadingSummary] = useState(false);

  useEffect(() => {
    loadVoices();
    fetchBookContent();
    loadBookmark();
    return () => {
      Speech.stop();
    };
  }, [id]);

  // Thêm useEffect mới để xử lý đọc liên tục
  useEffect(() => {
    let isMounted = true;
  
    const handleSpeech = async () => {
      if (isPlaying && sentences[currentSentence] && isMounted) {
        await speakCurrentSentence();
      }
    };
  
    handleSpeech();
  
    return () => {
      isMounted = false;
      if (!isPlaying) {
        Speech.stop();
      }
    };
  }, [currentSentence, isPlaying]);

  const loadVoices = async () => {
    const voices = await Speech.getAvailableVoicesAsync();
    const vnVoices = voices.filter(voice => voice.language.includes('vi'));
    setAvailableVoices(vnVoices.length > 0 ? vnVoices : voices);
    if (vnVoices.length > 0) {
      setSelectedVoice(vnVoices[0].identifier);
    } else {
      setSelectedVoice(voices[0].identifier);
    }
  };

  const fetchBookContent = async () => {
    try {
      setLoading(true);
      const result = await bookService.getBooks();
      
      if (result.success && result.data[id]) {
        const bookData = result.data[id];
        
        // Xử lý nếu là PDF
        if (bookData.chapters && Object.values(bookData.chapters).some(chapter => 
          typeof chapter.content === 'string' && chapter.content.endsWith('.pdf'))) {
          const pdfChapter = Object.values(bookData.chapters).find(chapter => 
            typeof chapter.content === 'string' && chapter.content.endsWith('.pdf')
          );
          
          if (pdfChapter) {
            setIsPDF(true);
            setPdfUrl(pdfChapter.content);
            setBookContent({
              title: bookData.name,
              chapters: [{ title: 'PDF Document', content: 'PDF File' }]
            });
            return;
          }
        }

        // Xử lý nếu là text
        const chaptersArray = await Promise.all(
          Object.entries(bookData.chapters).map(async ([chapterId, chapter]) => {
            let content = chapter.content;
            
            // Kiểm tra nếu content là URL Firebase Storage
            if (typeof content === 'string' && content.startsWith('https://firebasestorage.googleapis.com')) {
              try {
                const response = await fetch(content);
                content = await response.text();
              } catch (error) {
                console.error('Error fetching chapter content:', error);
                content = 'Không thể tải nội dung chương.';
              }
            }

            return {
              id: chapterId,
              title: chapter.name,
              content: content,
              orderindex: chapter.orderindex
            };
          })
        );

        const sortedChapters = chaptersArray.sort((a, b) => a.orderindex - b.orderindex);

        setBookContent({
          title: bookData.name,
          chapters: sortedChapters
        });

        if (sortedChapters.length > 0) {
          const sentenceArray = sortedChapters[0].content.match(/[^.!?]+[.!?]+/g) || [sortedChapters[0].content];
          setSentences(sentenceArray);
        }
      }
    } catch (error) {
      console.error('Error fetching book content:', error);
      setError("Không thể tải nội dung sách");
    } finally {
      setLoading(false);
    }
  };

  const speakCurrentSentence = async () => {
    if (!sentences[currentSentence]) return;
    
    try {
      await Speech.speak(sentences[currentSentence], {
        voice: selectedVoice,
        rate: speechRate,
        pitch: speechPitch,
        onDone: () => {
          // Chỉ tăng currentSentence và tiếp tục đọc nếu vẫn đang playing
          if (isPlaying) {
            if (currentSentence < sentences.length - 1) {
              setCurrentSentence(prev => prev + 1);
            } else {
              setIsPlaying(false);
              setCurrentSentence(0);
            }
          }
        },
        onError: (error) => {
          console.error('Speech error:', error);
          setIsPlaying(false);
          Alert.alert("Lỗi", "Không thể phát giọng nói");
        }
      });
    } catch (error) {
      console.error('Error speaking:', error);
      setIsPlaying(false);
      Alert.alert("Lỗi", "Không thể phát giọng nói");
    }
  };
  
  const togglePlayPause = async () => {
    if (isPlaying) {
      await Speech.stop();
      setIsPlaying(false);
    } else {
      // Khi bấm play, tiếp tục đọc từ câu hiện tại
      setIsPlaying(true);
    }
  };

  const changeChapter = async (index) => {
    await Speech.stop();
    setIsPlaying(false);
    setCurrentChapter(index);
    const text = bookContent.chapters[index].content;
    const sentenceArray = text.match(/[^.!?]+[.!?]+/g) || [text];
    setSentences(sentenceArray);
    setCurrentSentence(0);
  };

  const toggleBookmark = async () => {
    try {
      const newBookmarkState = !isBookmarked;
      setIsBookmarked(newBookmarkState);

      const bookmarkData = {
        bookId: id,
        chapter: currentChapter,
        sentence: currentSentence,
        timestamp: Date.now()
      };

      if (newBookmarkState) {
        await AsyncStorage.setItem(`ttsBookmark_${id}`, JSON.stringify(bookmarkData));
        await bookService.updateBook(id, {
          bookmarked: true,
          bookmarkData
        });
      } else {
        await AsyncStorage.removeItem(`ttsBookmark_${id}`);
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

  const handleGenerateSummary = async () => {
    try {
      setLoadingSummary(true);
      setShowSummary(true);
      
      let summaryResult;
      
      if (isPDF) {
        summaryResult = await generateSummary(pdfUrl, true);
      } else {
        const textToSummarize = bookContent.chapters
          .map(chapter => `${chapter.title}\n${chapter.content}`)
          .join('\n\n');
        summaryResult = await generateSummary(textToSummarize, false);
      }
      
      setSummary(summaryResult);
    } catch (error) {
      console.error('Error generating summary:', error);
      Alert.alert(
        "Lỗi",
        "Không thể tạo tóm tắt. Vui lòng thử lại sau."
      );
      setShowSummary(false);
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadBookmark = async () => {
    try {
      const bookmark = await AsyncStorage.getItem(`ttsBookmark_${id}`);
      if (bookmark) {
        const bookmarkData = JSON.parse(bookmark);
        setIsBookmarked(true);
        setCurrentChapter(bookmarkData.chapter);
        setCurrentSentence(bookmarkData.sentence);
      }
    } catch (error) {
      console.error('Error loading bookmark:', error);
    }
  };

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <BackButton />
        <View style={styles.headerRight}>
          <TouchableOpacity 
            onPress={handleGenerateSummary}
            style={styles.headerButton}
          >
            <DocumentTextIcon size={24} color="black" />
          </TouchableOpacity>
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

      {/* Content */}
      {isPDF ? (
        <View style={styles.pdfContainer}>
          {webViewLoading && (
            <View style={[styles.loadingContainer, { position: 'absolute', zIndex: 1 }]}>
              <Text>Đang tải PDF...</Text>
            </View>
          )}
          <WebView
            source={{
              uri: `https://docs.google.com/gview?embedded=true&url=${encodeURIComponent(pdfUrl)}`
            }}
            style={styles.webview}
            onLoadStart={() => setWebViewLoading(true)}
            onLoadEnd={() => setWebViewLoading(false)}
            onError={(syntheticEvent) => {
              const { nativeEvent } = syntheticEvent;
              console.warn('WebView error: ', nativeEvent);
              setError('Không thể tải file PDF. Vui lòng thử lại sau.');
            }}
            startInLoadingState={true}
            scalesPageToFit={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
          />
        </View>
      ) : (
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text>Đang tải nội dung...</Text>
            </View>
          ) : (
            <>
              <View style={styles.bookInfo}>
                <Text style={styles.bookTitle}>{bookContent?.title}</Text>
                <Text style={styles.chapterTitle}>
                  Chapter {currentChapter + 1}: {bookContent?.chapters[currentChapter]?.title}
                </Text>
              </View>

              <ScrollView style={styles.textContainer}>
                {sentences.map((sentence, index) => (
                  <Text
                    key={index}
                    style={[
                      styles.sentence,
                      index === currentSentence && styles.currentSentence
                    ]}
                  >
                    {sentence}
                  </Text>
                ))}
              </ScrollView>

              <View style={styles.controls}>
                <TouchableOpacity 
                  style={styles.playButton} 
                  onPress={togglePlayPause}
                >
                  {isPlaying ? (
                    <PauseIcon size={36} color="white" />
                  ) : (
                    <PlayIcon size={36} color="white" />
                  )}
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
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
            <Text style={styles.modalTitle}>Cài đặt giọng đọc</Text>
            
            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Giọng đọc</Text>
              <ScrollView style={styles.voiceList}>
                {availableVoices.map((voice) => (
                  <TouchableOpacity
                    key={voice.identifier}
                    style={[
                      styles.voiceButton,
                      selectedVoice === voice.identifier && styles.selectedVoice
                    ]}
                    onPress={() => setSelectedVoice(voice.identifier)}
                  >
                    <Text style={styles.voiceButtonText}>
                      {voice.name} ({voice.language})
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Tốc độ đọc: {speechRate}x</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2}
                step={0.25}
                value={speechRate}
                onValueChange={setSpeechRate}
              />
            </View>

            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Cao độ: {speechPitch}</Text>
              <Slider
                style={styles.slider}
                minimumValue={0.5}
                maximumValue={2}
                step={0.1}
                value={speechPitch}
                onValueChange={setSpeechPitch}
              />
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
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSummary}
        onRequestClose={() => setShowSummary(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Tóm tắt nội dung</Text>
            
            <ScrollView style={styles.summaryContent}>
              {loadingSummary ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#3B82F6" />
                  <Text style={styles.loadingText}>Đang tạo tóm tắt...</Text>
                </View>
              ) : (
                <Text style={styles.summaryText}>{summary}</Text>
              )}
            </ScrollView>

            <TouchableOpacity 
              style={styles.closeButton}
              onPress={() => setShowSummary(false)}
            >
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#F5F5F5',
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
      padding: 20,
    },
    bookInfo: {
      alignItems: 'center',
      marginBottom: 20,
    },
    bookTitle: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 8,
      textAlign: 'center',
    },
    chapterTitle: {
      fontSize: 18,
      color: '#6B7280',
      textAlign: 'center',
    },
    textContainer: {
      flex: 1,
      backgroundColor: 'white',
      padding: 16,
      borderRadius: 8,
      marginBottom: 20,
    },
    sentence: {
      fontSize: 16,
      lineHeight: 24,
      marginBottom: 8,
      color: '#4B5563',
    },
    currentSentence: {
      backgroundColor: '#EFF6FF',
      color: '#1D4ED8',
    },
    controls: {
      alignItems: 'center',
      paddingVertical: 20,
    },
    playButton: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: '#3B82F6',
      justifyContent: 'center',
      alignItems: 'center',
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
    voiceList: {
      maxHeight: 200,
    },
    voiceButton: {
      padding: 12,
      borderRadius: 8,
      backgroundColor: '#F3F4F6',
      marginBottom: 8,
    },
    selectedVoice: {
      backgroundColor: '#BFDBFE',
    },
    voiceButtonText: {
      fontSize: 14,
    },
    slider: {
      width: '100%',
      height: 40,
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
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
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
    chapterList: {
      marginVertical: 10,
    },
    chapterItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    chapterItemText: {
      fontSize: 16,
    },
    activeChapter: {
      backgroundColor: '#EFF6FF',
    },
    progressText: {
      textAlign: 'center',
      color: '#6B7280',
      marginTop: 8,
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
  pdfContainer: {
    flex: 1,
    height: Dimensions.get('window').height - 100,
    backgroundColor: '#F5F5F5',
  },
  webview: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  summaryContent: {
    maxHeight: '80%',
    paddingHorizontal: 16,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#4B5563',
  },
  loadingText: {
    marginTop: 10,
    color: '#6B7280',
  }
});