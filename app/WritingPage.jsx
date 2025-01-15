import React, { useState, useCallback, useEffect } from 'react';
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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { database, storage } from '../backend/firebase/FirebaseConfig';
import { ref, get, update } from 'firebase/database';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';

const WritingPage = () => {
  const router = useRouter();
  const { storyId } = useLocalSearchParams();
  
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
  const [chapterId, setChapterId] = useState(null);
  const [coverImage, setCoverImage] = useState(null);

  const fonts = [
    { label: 'Mặc định', value: 'default' },
    { label: 'Roboto', value: 'Roboto' },
    { label: 'Times New Roman', value: 'Times' },
  ];

  // Tải dữ liệu chương truyện khi component được mount
  useEffect(() => {
    loadChapterData();
  }, [storyId]);

  // Hàm tải dữ liệu chương truyện
  const loadChapterData = async () => {
    try {
      setLoading(true);
      const storyRef = ref(database, `books/${storyId}`);
      const snapshot = await get(storyRef);
      const storyData = snapshot.val();

      if (!storyData) {
        Alert.alert('Lỗi', 'Không tìm thấy truyện');
        return;
      }

      // Lấy chương cuối cùng hoặc tạo chương mới
      const chapters = storyData.chapters || {};
      const lastChapter = Object.entries(chapters).pop();
      
      if (lastChapter) {
        const [id, data] = lastChapter;
        setChapterId(id);
        setTitle(data.name || '');
        setContent(data.content || '');
        setHistory([data.content || '']);
      }

      setCoverImage(storyData.image);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu:', error);
      Alert.alert('Lỗi', 'Không thể tải dữ liệu chương truyện');
    } finally {
      setLoading(false);
    }
  };

  // Hàm lưu nội dung chương
  const saveChapter = async () => {
    if (!title.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tiêu đề chương');
      return;
    }

    try {
      setSaving(true);
      const chapterData = {
        name: title.trim(),
        content: content.trim(),
        updatedat: new Date().toISOString(),
      };

      if (chapterId) {
        // Cập nhật chương hiện có
        await update(ref(database, `books/${storyId}/chapters/${chapterId}`), chapterData);
      } else {
        // Tạo chương mới
        const newChapterRef = push(ref(database, `books/${storyId}/chapters`));
        await set(newChapterRef, {
          ...chapterData,
          createdat: new Date().toISOString(),
          orderindex: 1,
          view: 0,
        });
        setChapterId(newChapterRef.key);
      }

      Alert.alert('Thành công', 'Đã lưu chương truyện');
    } catch (error) {
      console.error('Lỗi khi lưu chương:', error);
      Alert.alert('Lỗi', 'Không thể lưu chương truyện');
    } finally {
      setSaving(false);
    }
  };

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

  // Xử lý thay đổi nội dung
  const handleContentChange = (text) => {
    setContent(text);
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
    }
  }, [currentIndex, history]);

  const handleRedo = useCallback(() => {
    if (currentIndex < history.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setContent(history[currentIndex + 1]);
    }
  }, [currentIndex, history]);

  // Kiểm tra khả năng Undo/Redo
  const canUndo = currentIndex > 0;
  const canRedo = currentIndex < history.length - 1;

  // Xử lý đăng truyện
  const handlePublish = async () => {
    try {
      if (!content.trim() || !title.trim()) {
        Alert.alert('Lỗi', 'Vui lòng điền đầy đủ tiêu đề và nội dung');
        return;
      }

      setSaving(true);
      await update(ref(database, `books/${storyId}`), {
        status: 'pending',
        updatedat: new Date().toISOString(),
      });

      Alert.alert('Thành công', 'Đã gửi truyện để duyệt');
      router.back();
    } catch (error) {
      console.error('Lỗi khi đăng truyện:', error);
      Alert.alert('Lỗi', 'Không thể đăng truyện');
    } finally {
      setSaving(false);
    }
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
          onPress={() => router.back()}
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
      <View style={styles.content}>
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
          onChangeText={setTitle}
          editable={!saving}
        />

        <TextInput
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
        />
      </View>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <View style={styles.navLeft}>
          <TouchableOpacity 
            style={[styles.navButton, !canUndo && styles.disabledButton]}
            onPress={handleUndo}
            disabled={!canUndo || saving}
          >
            <Ionicons name="arrow-back" size={24} color={canUndo ? '#666' : '#333'} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.navButton, !canRedo && styles.disabledButton]}
            onPress={handleRedo}
            disabled={!canRedo || saving}
          >
            <Ionicons name="arrow-forward" size={24} color={canRedo ? '#666' : '#333'} />
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

      {/* Save state */}
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
    paddingTop: 12,
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 16,
  },
  publishButton: {
    color: '#FFA500',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
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
  },
  contentInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    textAlignVertical: 'top',
  },
  bottomNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
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
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
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
