import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, FlatList, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { auth } from '../backend/firebase/FirebaseConfig';
import { getUserStories } from '../backend/services/storyHelpers';

const WriteScreen = () => {
  const router = useRouter();
  const [userStories, setUserStories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStories();
  }, []);

  const loadUserStories = async () => {
    try {
      setLoading(true);
      const stories = await getUserStories();
      setUserStories(stories);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải danh sách truyện');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditStory = (story) => {
    router.push({
      pathname: '/WritingPage',
      params: { storyId: story.id }
    });
  };

  const renderStoryItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.storyItem}
      onPress={() => handleEditStory(item)}
    >
      <Image 
        source={{ uri: item.image || 'default_image_url' }}
        style={styles.storyImage}
      />
      <View style={styles.storyInfo}>
        <Text style={styles.storyTitle}>{item.name}</Text>
        <Text style={styles.storyStatus}>
          {item.status === 'pending' ? 'Đang chờ duyệt' : 'Đã xuất bản'}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header with user info */}
      <View style={styles.header}>
        <View style={styles.userInfo}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: auth.currentUser?.photoURL || undefined }}
              defaultSource={require('../assets/images/icon.png')}
              style={styles.avatar}
            />
          </View>
          <Text style={styles.username}>{auth.currentUser?.displayName || 'Người dùng'}</Text>
        </View>
        <Text style={styles.headerTitle}>Viết</Text>
      </View>

      {/* Writing options */}
      <View style={styles.optionsContainer}>
        <TouchableOpacity 
          style={styles.optionButton}
          onPress={() => router.push('/AddStoryScreen')}
        >
          <Ionicons name="add-outline" size={24} color="white" />
          <Text style={styles.optionText}>Viết một truyện mới</Text>
        </TouchableOpacity>
      </View>

      {/* Stories list */}
      <View style={styles.storiesContainer}>
        <Text style={styles.sectionTitle}>Truyện của bạn</Text>
        <FlatList
          data={userStories}
          renderItem={renderStoryItem}
          keyExtractor={item => item.id}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {loading ? 'Đang tải...' : 'Bạn chưa có truyện nào'}
            </Text>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#333',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  username: {
    color: 'white',
    fontSize: 14,
  },
  headerTitle: {
    color: 'white',
    fontSize: 14,
  },
  optionsContainer: {
    marginBottom: 24,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
  },
  optionText: {
    color: 'white',
    fontSize: 16,
  },
  storiesContainer: {
    flex: 1,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  storyItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  storyImage: {
    width: 60,
    height: 90,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  storyInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  storyTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  storyStatus: {
    color: '#666',
    fontSize: 14,
  },
  emptyText: {
    color: '#666',
    textAlign: 'center',
    marginTop: 24,
  },
});

export default WriteScreen;