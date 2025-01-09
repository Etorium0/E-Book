import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import React, { useState } from 'react';
import ScreenWrapper from '../components/ScreenWrapper';
import { theme } from '../constants/theme';
import Icon from '../assets/icons';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import { hp, wp } from '../helpers/common';
import Input from '../components/Input';
import Button from '../components/Button';
import { auth, signInWithEmailAndPassword } from '../backend/firebase/FirebaseConfig'; // Import Firebase
import { getDatabase, ref, set } from 'firebase/database'; 

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async () => {
  if (!email || !password) {
    Alert.alert('Đăng nhập thất bại', "Vui lòng nhập đầy đủ thông tin");
    return;
  }

  setLoading(true);

  try {
    // Đảm bảo sử dụng phương thức đúng
    const userCredential = await signInWithEmailAndPassword(auth, email, password);

    setLoading(false);
    Alert.alert('Đăng nhập thành công', 'Chào mừng bạn trở lại!');
    router.push('HomeScreen'); // Chuyển hướng đến màn hình chính sau khi đăng nhập thành công
  } catch (error) {
    setLoading(false);
    let errorMessage = 'Đã xảy ra lỗi không xác định';

    // Các trường hợp lỗi thông dụng khi đăng nhập
    switch (error.code) {
      case 'auth/user-not-found':
        errorMessage = 'Tài khoản không tồn tại';
        break;
      case 'auth/wrong-password':
        errorMessage = 'Mật khẩu không đúng';
        break;
      case 'auth/invalid-email':
        errorMessage = 'Email không hợp lệ';
        break;
      case 'auth/invalid-credential':
        errorMessage = 'Thông tin đăng nhập không hợp lệ. Vui lòng kiểm tra lại.';
        break;
      default:
        errorMessage = error.message || errorMessage;
        break;
    }

    Alert.alert('Đăng nhập thất bại', errorMessage);
  }
};

  return (
    <ScreenWrapper bg="white">
      <StatusBar style="dark" />
      <View style={styles.container}>
        <BackButton router={router} />

        {/* Welcome */}
        <View>
          <Text style={styles.welcomeText}>Hey,</Text>
          <Text style={styles.welcomeText}>Welcome Back</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Text style={{ fontSize: hp(1.5), color: theme.colors.text }}>
            Vui lòng đăng nhập để tiếp tục!
          </Text>
          <Input
            icon={<Icon name="mail" size={26} strokeWidth={1.6} />}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
          />
          <Input
            icon={<Icon name="lock" size={26} strokeWidth={1.6} />}
            placeholder="Nhập mật khẩu"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
          <Text style={styles.forgotPassword}>
            Quên mật khẩu?
          </Text>

          {/* Button */}
          <Button title={'Đăng nhập'} loading={loading} onPress={onSubmit} />
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Bạn chưa có tài khoản?
          </Text>
          <Pressable onPress={() => router.push('signUp')}>
            <Text style={[styles.footerText, { color: theme.colors.primaryDark, fontWeight: theme.fonts.semibold }]}>
              Đăng ký
            </Text>
          </Pressable>
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: 45,
    paddingHorizontal: wp(5),
  },
  welcomeText: {
    fontSize: hp(4),
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
  },
  form: {
    gap: 25,
  },
  forgotPassword: {
    textAlign: 'right',
    fontWeight: theme.fonts.semibold,
    color: theme.colors.text,
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
    fontSize: hp(1.6),
  },
});
