import { Alert, Pressable, StyleSheet, Text, View, Platform, TouchableOpacity, Keyboard, ImageBackground, Modal, ScrollView } from 'react-native'; // Thêm Modal, ScrollView
import React, { useState } from 'react';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import Icon from '../assets/icons';
import Icon1 from 'react-native-vector-icons/AntDesign';
import { StatusBar } from 'expo-status-bar';
import BackButton from '../components/BackButton';
import { useRouter } from 'expo-router';
import Input from '../components/Input';
import Button from '../components/Button';
import { auth } from '../backend/firebase/FirebaseConfig';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getDatabase, ref, set } from 'firebase/database';
import Icon2 from 'react-native-vector-icons/FontAwesome';
import Icon3 from 'react-native-vector-icons/Feather'; // Thêm thư viện icon

const backgroundImage = require('../assets/images/Signup.png');

const SignUp = () => {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [numberphone, setNumberphone] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);


  const onSubmit = async () => {
    if (!email || !password || !name || !numberphone || !confirmPassword) {
      Alert.alert('Đăng ký thất bại', 'Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Đăng ký thất bại', 'Email phải có dạng @gmail.com');
      return;
    }

    const passwordRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      Alert.alert('Đăng ký thất bại', 'Mật khẩu phải dài hơn 8 ký tự, bao gồm chữ cái, chữ số và ký tự đặc biệt.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Đăng ký thất bại', 'Mật khẩu và xác nhận mật khẩu không khớp');
      return;
    }

    if (!agreeToTerms) {
      Alert.alert('Thông báo', 'Vui lòng đồng ý với điều khoản và điều kiện');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await updateProfile(user, { displayName: name });

      const db = getDatabase();
      const userRef = ref(db, 'users/' + user.uid);
      await set(userRef, {
        email: email,
        name: name,
        level: 1,
        numberphone: numberphone,
        avatar: '',
        role: 'user',
        reading_preferences: { categories: [], authors: [] },
        favorites: {},
        toreading: {},
        finished: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

      setLoading(false);
      Alert.alert('Đăng ký thành công', 'Tài khoản của bạn đã được tạo');
      router.push('Login');
    } catch (error) {
      setLoading(false);
      let errorMessage = 'Đã xảy ra lỗi không xác định';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'Email này đã được sử dụng.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Email không hợp lệ.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Mật khẩu phải có ít nhất 8 ký tự.';
      }

      Alert.alert('Đăng ký thất bại', errorMessage);
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
          <View style={styles.backButtonContainer}>
            <BackButton size={26} />
            <Text style={styles.backButtonText}>Đăng ký tài khoản</Text>
          </View>
          <View>
            <Text style={styles.welcomeText}>Chào mừng bạn đến với</Text>
            <Text style={styles.welcomeText}>E-BOOK</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.subText}>Tạo tài khoản miễn phí</Text>
            <Input
              icon={<Icon name="user" size={26} color={'#ffff'}/> }
              placeholder="Nhập tên của bạn"
              value={name}
              onChangeText={setName}
            />
            <Input
              icon={<Icon1 name="phone" size={26} color={'#ffff'} />}
              placeholder="Nhập số điện thoại"
              keyboardType="phone-pad"
              value={numberphone}
              onChangeText={setNumberphone}
            />
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
            <Input
              icon={<Icon name="lock" size={26} color={'#ffff'} />}
              placeholder="Nhập lại mật khẩu"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              rightIcon={
                <Pressable onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                  <Icon2 name={showConfirmPassword ? "eye" : "eye-slash"} size={22} color="#fff" />
                </Pressable>
              }
            />

            {/* Checkbox được thay bằng Icon */}
            <View style={styles.checkboxContainer}>
              <TouchableOpacity onPress={() => setAgreeToTerms(!agreeToTerms)}>
                <Icon3
                  name={agreeToTerms ? "check-circle" : "circle"}
                  size={22}
                  color={agreeToTerms ? "#A2B2FC" : "#fff"}
                />
              </TouchableOpacity>
              <Text style={styles.checkboxLabel}>
                Tôi đồng ý với{' '}
                <TouchableOpacity onPress={() => setModalVisible(true)}>
                  <Text style={styles.link}> Điều khoản và Điều kiện</Text>
                </TouchableOpacity>
              </Text>
            </View>

            <Button title="Đăng ký" loading={loading} onPress={onSubmit} />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Bạn đã có tài khoản?</Text>
            <Pressable onPress={() => router.push('Login')}>
              <Text style={[styles.footerText, { color: '#A2B2FC', fontWeight: '900' }]}>
                Đăng nhập
              </Text>
            </Pressable>
          </View>
        </View>
      </ImageBackground>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)} // Đóng modal khi nhấn nút back
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
           <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <Text style={styles.closeButtonText}>Đóng</Text>
            </TouchableOpacity>
            <ScrollView contentContainerStyle={{ paddingHorizontal: 20 }}>
              <Text style={styles.modalTitle}>Điều khoản và Điều kiện</Text>
              <Text style={[styles.modalText, { color: '#000' }]}>
  Chào mừng bạn đến với [Tên ứng dụng]! Trước khi sử dụng dịch vụ của chúng tôi, vui lòng đọc kỹ các điều khoản và điều kiện dưới đây. Bằng việc truy cập hoặc sử dụng ứng dụng, bạn đồng ý tuân thủ các điều khoản này.{"\n"}

  1. <Text style={{ fontWeight: 'bold' }}>Quyền và Nghĩa Vụ của Người Dùng</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Đăng ký tài khoản</Text>: Để sử dụng các tính năng của ứng dụng, bạn cần tạo một tài khoản người dùng. Bạn cam kết rằng thông tin bạn cung cấp là chính xác và đầy đủ. Bạn chịu trách nhiệm bảo vệ tài khoản của mình và thông báo cho chúng tôi nếu có bất kỳ hoạt động trái phép nào xảy ra trên tài khoản của bạn.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Tuân thủ pháp luật</Text>: Bạn cam kết sẽ không sử dụng ứng dụng để thực hiện các hành vi vi phạm pháp luật, đạo đức hoặc quyền lợi của bên thứ ba. Mọi hành vi gian lận, xâm phạm quyền sở hữu trí tuệ hoặc vi phạm các quy định của ứng dụng đều bị cấm.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Chia sẻ nội dung</Text>: Khi tải lên hoặc chia sẻ sách, bài viết, bình luận hoặc nội dung khác trên ứng dụng, bạn cam kết sở hữu hoặc có quyền sử dụng nội dung đó và cấp phép cho chúng tôi quyền sử dụng nội dung của bạn trong phạm vi dịch vụ của ứng dụng.{"\n"}

  2. <Text style={{ fontWeight: 'bold' }}>Quyền Sở Hữu và Sử Dụng Nội Dung</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Quyền sở hữu trí tuệ</Text>: Tất cả nội dung, bao gồm nhưng không giới hạn ở sách, hình ảnh, video, biểu tượng, nhãn hiệu và các tài liệu khác trong ứng dụng, đều thuộc quyền sở hữu của chúng tôi hoặc các bên cung cấp nội dung. Bạn không được sao chép, phân phối, hoặc tái sản xuất bất kỳ nội dung nào từ ứng dụng mà không có sự cho phép của chủ sở hữu.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Giấy phép sử dụng</Text>: Chúng tôi cấp cho bạn giấy phép không độc quyền, không chuyển nhượng để sử dụng ứng dụng và các tính năng của ứng dụng theo các điều khoản này. Giấy phép này chỉ áp dụng trong phạm vi sử dụng ứng dụng đọc sách, và không cho phép bạn sao chép hoặc tái phân phối nội dung.{"\n"}

  3. <Text style={{ fontWeight: 'bold' }}>Dịch Vụ và Nội Dung Của Bên Thứ Ba</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Liên kết đến các website bên ngoài</Text>: Ứng dụng có thể cung cấp các liên kết đến các trang web bên ngoài. Tuy nhiên, chúng tôi không kiểm soát và không chịu trách nhiệm về nội dung, tính chính xác, hoặc các điều khoản dịch vụ của các website này.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Nội dung bên thứ ba</Text>: Ứng dụng có thể chứa nội dung do bên thứ ba cung cấp, chẳng hạn như sách, bài viết, hoặc các tài liệu khác. Chúng tôi không đảm bảo tính chính xác, hoàn chỉnh hoặc cập nhật của nội dung này và không chịu trách nhiệm về bất kỳ vi phạm nào liên quan đến quyền sở hữu trí tuệ của bên thứ ba.{"\n"}

  4. <Text style={{ fontWeight: 'bold' }}>Bảo Mật và Chính Sách Quyền Riêng Tư</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Thông tin cá nhân</Text>: Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn theo chính sách quyền riêng tư của chúng tôi. Thông tin bạn cung cấp sẽ được sử dụng để cung cấp dịch vụ và cải thiện trải nghiệm của bạn trong ứng dụng.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Bảo mật tài khoản</Text>: Bạn chịu trách nhiệm bảo mật thông tin tài khoản của mình. Nếu bạn phát hiện có bất kỳ hành vi xâm nhập trái phép nào vào tài khoản, bạn cần thông báo cho chúng tôi ngay lập tức.{"\n"}

  5. <Text style={{ fontWeight: 'bold' }}>Điều Khoản Được Sửa Đổi</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Cập nhật điều khoản</Text>: Chúng tôi có quyền thay đổi, chỉnh sửa, hoặc bổ sung các điều khoản và điều kiện này vào bất kỳ thời điểm nào mà không cần thông báo trước. Các thay đổi sẽ có hiệu lực ngay khi được đăng tải trên ứng dụng. Bạn có trách nhiệm theo dõi các thay đổi này và tiếp tục sử dụng ứng dụng đồng nghĩa với việc bạn đồng ý với các điều khoản mới.{"\n"}

  6. <Text style={{ fontWeight: 'bold' }}>Giới Hạn Trách Nhiệm</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Không chịu trách nhiệm về lỗi hệ thống</Text>: Chúng tôi không chịu trách nhiệm về bất kỳ sự gián đoạn, lỗi hệ thống hoặc sự cố nào liên quan đến việc sử dụng ứng dụng. Chúng tôi cũng không chịu trách nhiệm đối với các tổn thất do sự cố này gây ra.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Giới hạn trách nhiệm</Text>: Trong phạm vi pháp luật cho phép, trách nhiệm của chúng tôi đối với bạn chỉ giới hạn ở việc hoàn trả phí bạn đã thanh toán cho dịch vụ trong vòng 30 ngày.{"\n"}

  7. <Text style={{ fontWeight: 'bold' }}>Quyền Hủy và Chấm Dứt Tài Khoản</Text>{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Hủy tài khoản</Text>: Bạn có thể hủy tài khoản của mình bất cứ lúc nào thông qua cài đặt tài khoản trong ứng dụng hoặc liên hệ với chúng tôi. Sau khi tài khoản bị hủy, bạn sẽ không thể truy cập vào các dịch vụ của ứng dụng.{"\n"}
    - <Text style={{ fontWeight: 'bold' }}>Chấm dứt tài khoản</Text>: Chúng tôi có quyền chấm dứt tài khoản của bạn nếu bạn vi phạm các điều khoản này hoặc có hành vi không phù hợp với các chính sách của chúng tôi.{"\n"}

  8. <Text style={{ fontWeight: 'bold' }}>Liên Hệ</Text>{"\n"}
    - Nếu bạn có bất kỳ câu hỏi hoặc thắc mắc nào về các điều khoản và điều kiện này, vui lòng liên hệ với chúng tôi qua email: [email@example.com].{"\n"}

  Cảm ơn bạn đã sử dụng [Tên ứng dụng]!
</Text>
            </ScrollView>

          </View>
        </View>
      </Modal>
    </KeyboardAwareScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    paddingTop: 40,
    paddingHorizontal: 16,
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
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center', // Căn giữa các phần tử theo chiều dọc
    marginTop: 0,
  },
  checkboxLabel: {
    color: '#fff',
    marginLeft: 8, // Khoảng cách giữa checkbox và văn bản
  },
  link: {
    color: '#A2B2FC',
    marginTop: 0,
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
  },
  backButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  backButtonText: {
    color: '#ffff',
    fontSize: 18,
    marginLeft: 60,
    textAlign: 'center',
    fontWeight: '900',
  },
    modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    }
});

export default SignUp;
