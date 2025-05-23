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
    console.log('Starting XMLHttpRequest for URL:', url); // Log URL đang được xử lý

    const xhr = new XMLHttpRequest();
    
    // Log khi có lỗi xảy ra
    xhr.addEventListener('error', (event) => {
      console.error('XMLHttpRequest failed:', event); // Log thông báo lỗi của XMLHttpRequest
      reject(new Error('Failed to fetch URL as blob'));
    });

    // Log khi trạng thái thay đổi
    xhr.addEventListener('readystatechange', () => {
      console.log('XMLHttpRequest state changed:', xhr.readyState); // Log trạng thái của XMLHttpRequest

      if (xhr.readyState === 4) {
        if (xhr.status === 200) {
          console.log('Request successful, blob created'); // Log khi yêu cầu thành công
          resolve(xhr.response); // Trả về kết quả là blob
        } else {
          console.error('Request failed with status:', xhr.status); // Log mã trạng thái lỗi
          reject(new Error(`Failed to fetch URL, status code: ${xhr.status}`)); // Thông báo lỗi
        }
      }
    });

    xhr.open('GET', url); // Gửi yêu cầu GET tới URL
    xhr.responseType = 'blob'; // Thiết lập loại phản hồi là blob
    xhr.send(); // Gửi yêu cầu
  });
};

  const uploadImage = async (uri) => {
  console.log('Start uploading image from URI:', uri); // Log URI ảnh
  setUploading(true);
  const blob = await urlToBlob(uri);
  console.log('Blob ready for upload:', blob); // Log blob đã sẵn sàng

  const storage = getStorage();
  const storageReference = storageRef(storage, `avatar/${Date.now()}`);
  const metadata = {
    contentType: 'image/jpeg',
  };

  console.log('Storage reference created:', storageReference); // Log tham chiếu Firebase Storage

  const uploadTask = uploadBytesResumable(storageReference, blob, metadata);

  uploadTask.on(
    'state_changed',
    (snapshot) => {
      const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      console.log('Upload progress:', progress, '%'); // Log tiến độ tải lên
    },
    (error) => {
      console.error('Upload failed with error:', error.message, 'Code:', error.code); // Log lỗi khi tải lên
      console.log('Error details:', error); // Log thông tin chi tiết về lỗi
      setUploading(false);
    },
    async () => {
      try {
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        console.log('File available at:', downloadURL); // Log URL sau khi tải lên thành công

        // Lưu URL vào Realtime Database
        const auth = getAuth();
        const currentUser = auth.currentUser;
        console.log('Current user:', currentUser); // Log thông tin người dùng

        if (currentUser) {
          const userId = currentUser.uid;
          const db = getDatabase();
          const userRef = ref(db, `users/${userId}`);
          
          await update(userRef, { avatar: downloadURL });
          console.log('Avatar URL saved to Realtime Database');
        } else {
          console.error('User is not authenticated');
        }
      } catch (error) {
        console.error('Failed to save URL to database:', error); // Log lỗi khi lưu URL vào database
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