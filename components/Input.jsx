import { StyleSheet, TextInput, View } from 'react-native';
import React from 'react';
import { theme } from '../constants/theme';
import { hp } from '../helpers/common';

const Input = (props) => {
  return (
    <View style={[styles.container, props.containerStyles && props.containerStyles]}>
      {/* Hiển thị icon bên trái nếu có */}
      {props.icon && props.icon}

      {/* TextInput với style và các props khác */}
      <TextInput
        style={[{ flex: 1, color: '#fff' }, props.inputTextStyle]} // Thêm color và có thể thay đổi màu chữ từ inputTextStyle
        placeholderTextColor={'#ffff'}
        ref={props.inputText && props.inputText}
        {...props}
      />
      
      {/* Hiển thị icon bên phải nếu có */}
      {props.rightIcon && props.rightIcon}
    </View>
  );
};

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: hp(6.2),
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: theme.colors.text,
    borderRadius: 8,
    borderCurve: 'continuous',
    paddingHorizontal: 18,
    gap: 12,
  }
});
