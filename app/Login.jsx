import { Alert, Pressable, StyleSheet, Text, View, Platform, TouchableOpacity, Keyboard, ImageBackground, Modal, ScrollView } from 'react-native';
import React, { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
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
const backgroundImage = require('../assets/images/Signup.png');  // Your background image
import Icon2 from 'react-native-vector-icons/FontAwesome';

const Login = () => {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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
      router.push('HomeScreens'); // Chuyển hướng đến màn hình chính sau khi đăng nhập thành công
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
    <KeyboardAwareScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
    >
      <ImageBackground source={backgroundImage} style={styles.container}>
        <StatusBar style="light" />
        <View style={styles.overlay}>
          <View>
            <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
            <Text style={styles.welcomeText}>E-BOOK</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.subText}>Đăng nhập để tiếp tục</Text>
            <Input
            icon={<Icon name="mail" size={26} color={'#ffff'} />}
            placeholder="Nhập email"
            value={email}
            onChangeText={setEmail}
          />
            <Input
              icon={<Icon name="lock" size={26} color={'#ffff'} />}
              placeholder="Nhập mật khẩu"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              rightIcon={
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Icon2 name={showPassword ? "eye" : "eye-slash"} size={22} color="#fff" />
                </Pressable>
              }
            />
          <Text style={styles.forgotPassword}>
            Quên mật khẩu?
          </Text>

            <Button title="Đăng nhập" loading={loading} onPress={onSubmit} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn chưa có tài khoản?</Text>
            <Pressable onPress={() => router.push('signUp')}>
              <Text style={[styles.footerText, { color: '#A2B2FC', fontWeight: '900' }]}>
                Đăng ký
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
         </KeyboardAwareScrollView>
  );
};


export default Login;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
    marginTop: 120,
  },
  welcomeText: {
    fontSize: 30,
    fontWeight: '900',
    alignItems: 'center',
    textAlign: 'center',
    color: '#FFFFFF',
  },
  form: {
    gap: 15,
    marginBottom: 20,
  },
  subText: {
    fontSize: 15,
    marginBottom: 10,
    alignItems: 'center',
    textAlign: 'center',
    color: '#FFFFFF',
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
    marginTop: -10,
    textAlign: 'center',
    color: '#FFFFFF',
    fontSize: 16,
  }
});
