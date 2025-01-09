import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import Input from '../components/Input';
import Button from '../components/Button';
import { auth } from '../backend/firebase/FirebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database'; // Thêm import Realtime Database

const SignUp = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
    if (!email || !password || !name) {
      Alert.alert('Đăng ký thất bại', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setLoading(true);

    try {
      // Tạo tài khoản người dùng
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Cập nhật tên hiển thị của người dùng
      await updateProfile(user, { displayName: name });

      // Cập nhật thông tin người dùng vào Firebase Realtime Database
      const db = getDatabase();
      const userRef = ref(db, 'users/' + user.uid); // Sử dụng user.uid làm key
      await set(userRef, {
        email: email,
        name: name,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        level: 1, // Mức độ mặc định
        numberphone: '', // Mặc định là trống, có thể yêu cầu người dùng cập nhật sau
      });

      setLoading(false);
      Alert.alert('Đăng ký thành công', 'Tài khoản của bạn đã được tạo');
      router.push('Login'); // Điều hướng đến màn hình đăng nhập
    } catch (error) {
      setLoading(false);

      // Xử lý lỗi chi tiết
      let errorMessage = 'Đã xảy ra lỗi không xác định';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu phải có ít nhất 6 ký tự.';
      }

      Alert.alert('Đăng ký thất bại', errorMessage);
    }
  };

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />
        <View>
          <Text style={styles.welcomeText}>Hãy,</Text>
          <Text style={styles.welcomeText}>Bắt đầu</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.subText}>
            Vui lòng điền thông tin để đăng ký
          </Text>
          <Input
            icon={<Icon name="user" size={26} />}
            placeholder="Nhập tên của bạn"
            value={name}
            onChangeText={setName}
          />
          <Input
            icon={<Icon name="mail" size={26} />}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            icon={<Icon name="lock" size={26} />}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          <Button title="Đăng ký" loading={loading} onPress={onSubmit} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Bạn đã có tài khoản?</Text>
          <Pressable onPress={() => router.push('Login')}>
            <Text style={[styles.footerText, { color: theme.colors.primaryDark }]} >
              Đăng nhập
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: 16,
  },
  welcomeText: {
    fontSize: 36,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  subText: {
    fontSize: 18,
    color: theme.colors.text,
    marginBottom: 15,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 5,
  },
  footerText: {
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
  },
});

export default SignUp;
