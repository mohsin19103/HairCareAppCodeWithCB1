import React, { useState } from 'react';
import { StyleSheet, Text, View, ImageBackground, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';

const SignupScreen = () => {
  const navigation = useNavigation();

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleCreateAccount = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() ||
        !formData.email.trim() || !formData.password || !formData.country.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please fill all fields',
      });
      return;
    }

    if (formData.password.length < 3) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Password must be at least 3 characters',
      });
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post('http://172.20.10.4:8080/signup', {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        country: formData.country.trim()
      });

      if (response.status === 200 || response.status === 201) {
        const serverVerificationCode = response.data?.verificationCode ?? null;
        navigation.navigate('VerificationScreen', {
          email: formData.email.trim().toLowerCase(),
          verificationCodeFromServer: serverVerificationCode
        });
      }
    } catch (error) {
      let message = 'An error occurred during signup';
      if (error.response?.data?.message) {
        message = error.response.data.message;
      }

      Toast.show({
        type: 'error',
        text1: 'Signup Failed',
        text2: message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <View style={styles.container}>
      {/* Background Image with Gradient Overlay */}
      <ImageBackground
        source={require('../assets/backimage.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']}
          style={styles.overlay}
        >
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us today</Text>
        </LinearGradient>
      </ImageBackground>

      {/* Form Card */}
      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={22} color="#2e7d32" style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder="First Name"
            placeholderTextColor="#777"
            value={formData.firstName}
            onChangeText={(text) => handleInputChange('firstName', text)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="user" size={22} color="#2e7d32" style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder="Last Name"
            placeholderTextColor="#777"
            value={formData.lastName}
            onChangeText={(text) => handleInputChange('lastName', text)}
            autoCapitalize="words"
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="envelope" size={22} color="#2e7d32" style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder="Email"
            placeholderTextColor="#777"
            keyboardType="email-address"
            autoCapitalize="none"
            value={formData.email}
            onChangeText={(text) => handleInputChange('email', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="lock" size={22} color="#2e7d32" style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder="Password"
            placeholderTextColor="#777"
            secureTextEntry={true}
            value={formData.password}
            onChangeText={(text) => handleInputChange('password', text)}
          />
        </View>

        <View style={styles.inputContainer}>
          <FontAwesome name="globe" size={22} color="#2e7d32" style={styles.icon} />
          <TextInput
            style={styles.textInput}
            placeholder="Country"
            placeholderTextColor="#777"
            value={formData.country}
            onChangeText={(text) => handleInputChange('country', text)}
          />
        </View>

        <TouchableOpacity onPress={handleCreateAccount} disabled={isLoading}>
          <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.signinButton}>
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <Text style={styles.signinText}>Sign Up</Text>
                <AntDesign name="arrowright" size={22} color="#fff" />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleLogin}>
          <Text style={styles.footerText}>
            Already have an account? <Text style={styles.create}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>

      <Toast />
    </View>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  backgroundImage: {
    height: '40%',
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 26,
    fontWeight: 'bold',
  },
  subtitle: {
    color: '#ddd',
    fontSize: 16,
    marginTop: 5,
  },
  formContainer: {
    backgroundColor: '#fff',
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 15,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f8e9',
    borderRadius: 10,
    paddingHorizontal: 10,
    height: 55,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#c8e6c9',
  },
  icon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  signinButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 50,
    borderRadius: 25,
  },
  signinText: {
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
    fontWeight: 'bold',
  },
  footerText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#555',
  },
  create: {
    color: '#2e7d32',
    fontWeight: 'bold',
  },
});