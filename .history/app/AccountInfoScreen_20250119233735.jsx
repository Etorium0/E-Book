import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronRightIcon, CameraIcon, PencilIcon } from 'react-native-heroicons/outline';
import BackButton from '../components/BackButton';
import { getAuth } from 'firebase/auth';
import Button from '../components/Button';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getDatabase, ref, get, update } from 'firebase/database'; // Đảm bảo chỉ khai báo một lần


const AccountInfoScreen = () => {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const navigation = useNavigation();
  const [imageUri, setImageUri] = useState(null);

  const checkPermission = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    alert('Permission to access media library is required!');
  }
};

  useEffect(() => {
    checkPermission();
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (currentUser) {
      const userId = currentUser.uid;

      const db = getDatabase();
      const userRef = ref(db, `users/${userId}`);

      get(userRef)
        .then((snapshot) => {
          if (snapshot.exists()) {
            setUserData(snapshot.val());
          } else {
            setUserData(null);
          }
          setLoading(false);
        })
        .catch((error) => {
          console.error('Lỗi khi lấy dữ liệu người dùng:', error);
          setLoading(false);
        });
    } else {
      console.log('Không có người dùng đăng nhập');
      setLoading(false);
    }
  }, []);

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      console.log(result.assets[0].uri);

      setImageUri(result.assets[0].uri);
      uploadImage(result.assets[0].uri); // Call uploadImage with the URI
    }
  };

  const urlToBlob = (url) => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.addEventListener('error', reject);
      xhr.addEventListener('readystatechange', () => {
        if (xhr.readyState === 4) {
          resolve(xhr.response);
        }
      });
      xhr.open('GET', url);
      xhr.responseType = 'blob';
      xhr.send();
    });
  };

  const uploadImage = async (uri) => {
  setUploading(true);
  const blob = await urlToBlob(uri);

  const storage = getStorage();
  const storageReference = storageRef(storage, `avatar/${Date.now()}`);
  const metadata = {
    contentType: 'image/jpeg',
  };

  const uploadTask = uploadBytesResumable(storageReference, blob, metadata);

  uploadTask.on(
  'state_changed',
  (snapshot) => {
    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
    console.log('Upload is ' + progress + '% done');
  },
  (error) => {
    console.error('Upload failed:', error.message);
    alert('Upload failed. Please try again.');
    setUploading(false);
  },
  async () => {
    try {
      const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
      console.log('File available at', downloadURL);
      const auth = getAuth();
      const currentUser = auth.currentUser;

      if (currentUser) {
        const userId = currentUser.uid;
        const db = getDatabase();
        const userRef = ref(db, `users/${userId}`);
        
        await update(userRef, { avatar: downloadURL });
        console.log('Avatar URL saved to Realtime Database');
      }
    } catch (error) {
      console.error('Failed to save URL to database:', error);
    } finally {
      setUploading(false);
    }
  }
);
};


  const onSubmit = () => {
    const auth = getAuth();
    auth.signOut()
      .then(() => {
        console.log('Đăng xuất thành công');
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error('Lỗi khi đăng xuất:', error);
      });
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3498db" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Không có dữ liệu người dùng!</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <BackButton />
        <Text style={styles.headerTitle}>Thông tin tài khoản</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView>
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: imageUri || userData.avatar || 'https://via.placeholder.com/100' }}
              style={styles.avatar}
            />
            <TouchableOpacity style={styles.cameraIcon} onPress={pickImage}>
              <CameraIcon size={20} color="white" />
            </TouchableOpacity>
          </View>
          <View style={styles.nameSection}>
            <Text style={styles.userName}>{userData.name}</Text>
            <TouchableOpacity style={styles.editIcon}>
              <PencilIcon size={15} color="white" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.contactInfoSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{userData.numberphone || 'Chưa có số điện thoại'}</Text>
            <ChevronRightIcon size={15} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>{userData.email || 'Chưa có email'}</Text>
            <ChevronRightIcon size={15} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.settingsSection}>
          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Đổi mật khẩu</Text>
            <ChevronRightIcon size={15} color="#666" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.menuItem}>
            <Text style={styles.menuText}>Xóa tài khoản</Text>
            <ChevronRightIcon size={15} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: 'center' }}>
          <Button title="Đăng Xuất" loading={uploading} onPress={onSubmit} buttonStyle={{ width: 250 }} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1F1F1F',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 0,
    borderBottomColor: '#333',
    marginBottom: 0,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  profileSection: {
    alignItems: 'center',
    padding: 24,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 60,
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#A2B2FC',
    borderRadius: 15,
    padding: 5,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  userName: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  editIcon: {
    marginLeft: 8,
    backgroundColor: '#A2B2FC',
    borderRadius: 12,
    padding: 5,
  },
  contactInfoSection: {
    marginTop: 0,
    paddingVertical: 8,
    backgroundColor: 'black',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
  },
  settingsSection: {
    marginTop: 16,
    paddingVertical: 8,
    backgroundColor: 'black',
    borderRadius: 10,
    marginHorizontal: 16,
    overflow: 'hidden',
    marginBottom: 20,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomColor: '#333',
    backgroundColor: 'black',
  },
  menuText: {
    color: 'white',
    fontSize: 16,
  },
  errorText: {
    color: 'white',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
});

export default AccountInfoScreen; 