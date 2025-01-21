import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  SafeAreaView,
  StatusBar,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  BackHandler
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { database, storage } from '../backend/firebase/FirebaseConfig';
import { ref, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import {
  addChapter,
  updateChapterContent,
  getStoryDetails,
  getChapterDetails,
  updateStoryStatus,
  loadChapterContent
} from '../backend/services/storyHelpers';

const WritingPage = () => {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  const contentInputRef = useRef(null);
  
  // State cho cài đặt hiển thị
  const [showSettings, setShowSettings] = useState(false);
  const [fontSize, setFontSize] = useState(16);
  const [lineHeight, setLineHeight] = useState(1.5);
  const [fontFamily, setFontFamily] = useState('default');
  
  // State cho nội dung và chỉnh sửa
  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');
  const [history, setHistory] = useState(['']);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [chapterId, setChapterId] = useState(null);
  const [storyDetails, setStoryDetails] = useState(null);

  const fonts = [
    { label: 'Mặc định', value: 'default' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Times New Roman', value: 'Times' },
  ];

  // Xử lý back button
  useEffect(() => {
    const handleBackPress = () => {
      if (hasUnsavedChanges) {
        Alert.alert(
          'Thay đổi chưa được lưu',
          'Bạn có muốn lưu thay đổi trước khi thoát không?',
          [
            {
              text: 'Không lưu',
              style: 'destructive',
              onPress: () => router.back(),
            },
            {
              text: 'Lưu',
              onPress: async () => {
                await saveChapter();
                router.back();
              },
            },
            {
              text: 'Hủy',
              style: 'cancel',
            },
          ]
        );
        return true;
      }
      return false;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [hasUnsavedChanges]);

  // Tải dữ liệu truyện và chương khi component được mount
  useEffect(() => {
    loadData();
  }, [storyId]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Lấy thông tin truyện
      const story = await getStoryDetails(storyId);
      setStoryDetails(story);

      // Kiểm tra xem có chương nào không
      if (story.chapters) {
        const chaptersArray = Object.entries(story.chapters);
        if (chaptersArray.length > 0) {
          const [lastChapterId, lastChapter] = chaptersArray[chaptersArray.length - 1];
          setChapterId(lastChapterId);
          setTitle(lastChapter.name || '');
          
          // Tải nội dung chương từ URL với UTF-8 encoding
          if (lastChapter.content_url) {
            const chapterContent = await loadChapterContent(lastChapter.content_url);
            setContent(chapterContent);
            setHistory([chapterContent]);
          }
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu truyện');
    } finally {
      setLoading(false);
    }
  };

  // Xử lý thay đổi nội dung
  const handleContentChange = (text) => {
    setContent(text);
    setHasUnsavedChanges(true);
    
    // Cập nhật lịch sử cho undo/redo
    if (text !== history[currentIndex]) {
      const newHistory = history.slice(0, currentIndex + 1);
      newHistory.push(text);
      setHistory(newHistory);
      setCurrentIndex(newHistory.length - 1);
    }
  };

  // Xử lý Undo/Redo
  const handleUndo = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setContent(history[currentIndex - 1]);
      setHasUnsavedChanges(true);
    }
  }, [currentIndex, history]);

  const handleRedo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setContent(history[currentIndex + 1]);
      setHasUnsavedChanges(true);
    }
  }, [currentIndex, history]);

  // Tính toán khả năng Undo/Redo
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Xử lý upload ảnh
  const handleImageUpload = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const imageUri = result.assets[0].uri;
        const response = await fetch(imageUri);
        const blob = await response.blob();
        
        const imageRef = storageRef(storage, `chapters/${storyId}/${Date.now()}`);
        await uploadBytes(imageRef, blob);
        const downloadUrl = await getDownloadURL(imageRef);

        // Chèn URL ảnh vào nội dung
        const imageTag = `[image:${downloadUrl}]`;
        const newContent = `${content}\n${imageTag}\n`;
        handleContentChange(newContent);
      }
    } catch (error) {
      console.error('Lỗi khi upload ảnh:', error);
      Alert.alert('Lỗi', 'Không thể upload ảnh');
    }
  };

  // Xử lý lưu chương
  const saveChapter = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề chương');
      return;
    }

    try {
      setSaving(true);
      
      if (chapterId) {
        // Cập nhật chương hiện có
        await updateChapterContent(storyId, chapterId, content.trim());
        await update(ref(database, `books/${storyId}/chapters/${chapterId}`), {
          name: title.trim(),
          updatedat: new Date().toISOString(),
        });
      } else {
        // Tạo chương mới
        const newChapterId = await addChapter(storyId, {
          title: title.trim(),
          content: content.trim()
        });
        setChapterId(newChapterId);
      }

      setHasUnsavedChanges(false);
      Alert.alert('Thành công', 'Đã lưu chương truyện');
    } catch (error) {
      console.error('Lỗi khi lưu chương:', error);
      Alert.alert('Lỗi', 'Không thể lưu chương truyện');
    } finally {
      setSaving(false);
    }
  };

  // Xử lý đăng truyện
  const handlePublish = async () => {
    // Kiểm tra nếu có thay đổi chưa lưu
    if (hasUnsavedChanges) {
      Alert.alert(
        'Lưu ý',
        'Bạn có thay đổi chưa được lưu. Vui lòng lưu trước khi đăng.',
        [
          { text: 'OK' }
        ]
      );
      return;
    }

    // Xác nhận đăng truyện
    Alert.alert(
      'Xác nhận đăng truyện',
      'Truyện của bạn sẽ được gửi để kiểm duyệt. Bạn có chắc chắn muốn đăng không?',
      [
        {
          text: 'Hủy',
          style: 'cancel',
        },
        {
          text: 'Đăng',
          onPress: async () => {
            try {
              setSaving(true);
              await updateStoryStatus(storyId, 'pending');
              Alert.alert('Thành công', 'Đã gửi truyện để duyệt');
              router.back();
            } catch (error) {
              console.error('Lỗi khi đăng truyện:', error);
              Alert.alert('Lỗi', 'Không thể đăng truyện');
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFA500" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => {
            if (hasUnsavedChanges) {
              Alert.alert(
                'Thay đổi chưa được lưu',
                'Bạn có muốn lưu thay đổi trước khi thoát không?',
                [
                  {
                    text: 'Không lưu',
                    style: 'destructive',
                    onPress: () => router.back(),
                  },
                  {
                    text: 'Lưu',
                    onPress: async () => {
                      await saveChapter();
                      router.back();
                    },
                  },
                  {
                    text: 'Hủy',
                    style: 'cancel',
                  },
                ]
              );
            } else {
              router.back();
            }
          }}
          disabled={saving}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chỉnh sửa chương</Text>
        <TouchableOpacity 
          onPress={handlePublish}
          disabled={saving}
        >
          <Text style={[styles.publishButton, saving && styles.disabledText]}>
            {saving ? 'ĐANG LƯU...' : 'ĐĂNG'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.content}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
      >
        <ScrollView style={styles.scrollContent}>
          <TouchableOpacity 
            style={styles.mediaUpload}
            onPress={handleImageUpload}
            disabled={saving}
          >
            <Ionicons name="image-outline" size={24} color="#666" />
            <Text style={styles.mediaText}>Nhấp để thêm ảnh</Text>
          </TouchableOpacity>

          <TextInput
            style={[styles.titleInput, { fontSize: fontSize }]}
            placeholder="Đặt tiêu đề cho chương truyện"
            placeholderTextColor="#666"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              setHasUnsavedChanges(true);
            }}
            editable={!saving}
            autoCorrect={false}
            textAlignVertical="top"
            maxLength={200}
            multiline={false}
          />

          <TextInput
            ref={contentInputRef}
            style={[
              styles.contentInput,
              {
                fontSize: fontSize,
                lineHeight: fontSize * lineHeight,
                fontFamily: fontFamily === 'default' ? undefined : fontFamily
              }
            ]}
            placeholder="Nhấp vào đây để bắt đầu viết"
            placeholderTextColor="#666"
            multiline
            value={content}
            onChangeText={handleContentChange}
            editable={!saving}
            autoCorrect={false}
            textAlignVertical="top"
            blurOnSubmit={false}
            scrollEnabled={true}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity 
            style={[styles.navButton, !canUndo && styles.disabledButton]}
            onPress={handleUndo}
            disabled={!canUndo || saving}
          >
            <Ionicons name="arrow-undo" size={24} color={canUndo ? '#666' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, !canRedo && styles.disabledButton]}
            onPress={handleRedo}
            disabled={!canRedo || saving}
          >
            <Ionicons name="arrow-redo" size={24} color={canRedo ? '#666' : '#333'} />
          </TouchableOpacity>
        </View>
        <View style={styles.navRight}>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={() => setShowSettings(true)}
            disabled={saving}
          >
            <Text style={styles.formatText}>Aa</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={handleImageUpload}
            disabled={saving}
          >
            <Ionicons name="image" size={24} color="#FFA500" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton}
            onPress={saveChapter}
            disabled={saving}
          >
            <Ionicons name="save" size={24} color="#FFA500" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Settings Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={showSettings}
        onRequestClose={() => setShowSettings(false)}
      >
        <View style={styles.modalContainer}>
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
                  <Text style={styles.controlButtonText}>A-</Text>
                </TouchableOpacity>
                <Text style={styles.settingValue}>{fontSize}</Text>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => setFontSize(prev => Math.min(24, prev + 2))}
                >
                  <Text style={styles.controlButtonText}>A+</Text>
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
                  <Text style={styles.controlButtonText}>-</Text>
                </TouchableOpacity>
                <Text style={styles.settingValue}>{lineHeight.toFixed(1)}</Text>
                <TouchableOpacity 
                  style={styles.controlButton}
                  onPress={() => setLineHeight(prev => Math.min(2, prev + 0.1))}
                >
                  <Text style={styles.controlButtonText}>+</Text>
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

      {/* Loading Overlay */}
      {saving && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFA500" />
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: 30,
    backgroundColor: '#1A1A1A',
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  publishButton: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  mediaUpload: {
    height: 200,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  mediaText: {
    color: '#666',
    marginTop: 8,
  },
  titleInput: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    padding: 8,
  },
  contentInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    textAlignVertical: 'top',
    minHeight: 200,
    padding: 8,
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  navLeft: {
    flexDirection: 'row',
    gap: 16,
  },
  navRight: {
    flexDirection: 'row',
    gap: 16,
  },
  navButton: {
    padding: 8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  formatText: {
    color: '#FFA500',
    fontSize: 18,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
  },
  modalTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  settingSection: {
    marginBottom: 20,
  },
  settingLabel: {
    color: 'white',
    fontSize: 16,
    marginBottom: 10,
  },
  settingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  controlButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    minWidth: 40,
    alignItems: 'center',
  },
  controlButtonText: {
    color: 'white',
    fontSize: 16,
  },
  settingValue: {
    color: 'white',
    fontSize: 16,
    minWidth: 40,
    textAlign: 'center',
  },
  fontFamilyContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'center',
  },
  fontButton: {
    backgroundColor: '#333',
    padding: 10,
    borderRadius: 8,
    minWidth: 100,
    alignItems: 'center',
  },
  selectedFont: {
    backgroundColor: '#FFA500',
  },
  fontButtonText: {
    color: 'white',
    fontSize: 14,
  },
  selectedFontText: {
    color: 'black',
  },
  closeButton: {
    backgroundColor: '#FFA500',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  closeButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledText: {
    opacity: 0.5,
  },
});

export default WritingPage;