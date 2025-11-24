import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const navigation = useNavigation();
  const url = "http://10.141.70.3:8080"
  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);

  // Check if user is already logged in and not logged out beforen 
  useEffect(() => {
    const checkUserLogin = async () => {
      try {
        const savedToken = await AsyncStorage.getItem('token');
        const savedUser = await AsyncStorage.getItem('user');
        const isLoggedIn = await AsyncStorage.getItem('isLoggedIn');
        const hasLoggedOut = await AsyncStorage.getItem('hasLoggedOut');

        if (savedToken && savedUser && isLoggedIn === 'true' && hasLoggedOut !== 'true') {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Scanner' }],
          });
          return;
        }
      } catch (e) {
        console.log('Error reading AsyncStorage', e);
      } finally {
        setCheckingLogin(false);
      }
    };
    checkUserLogin();
  }, []);

  // Countdown Timer for verification code
  useEffect(() => {
    if (step === 'verifyCode' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  const formatTime = () => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const handleSignIn = async () => {
    if (!username || !password) {
      Toast.show({ type: 'error', text1: 'Please fill in both fields' });
      return;
    }

    try {
      setLoading(true);
      const response = await axios.post(`${url}/login`, {
        email: username,
        password,
      });
      setLoading(false);

      if (response.status === 200) {
        const userData = response.data.user;
        const authToken = response.data.token;

        // Save login info
        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('hasLoggedOut', 'false');

        Toast.show({ type: 'success', text1: 'Login Successful', text2: 'Welcome back 👋' });

        // 🚀 Always go to GenderSelection for fresh login
        navigation.reset({
          index: 0,
          routes: [{ name: 'GenderSelectionScreen' }],
        });
      }
    } catch (error) {
      console.error(error)
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Login Failed',
        text2: error.response?.data?.message || 'Invalid credentials',
      });
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      Toast.show({ type: 'error', text1: 'Enter your email' });
      return;
    }
    try {
      setLoading(true);
      await axios.post('http://10.21.161.3:8080/login/forgotPassword', { email: username });
      setLoading(false);
      Toast.show({ type: 'success', text1: 'Verification code sent' });
      setStep('verifyCode');
      setTimeLeft(300);
    } catch (error) {
      setLoading(false);
      Toast.show({ type: 'error', text1: 'Error', text2: error.response?.data?.message });
    }
  };

  const handleDigitChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const updatedDigits = [...verificationDigits];
      updatedDigits[index] = text;
      setVerificationDigits(updatedDigits);
      if (text && index < 3) inputsRef.current[index + 1].focus();
    }
  };

  const handleVerifyCode = async () => {
    const code = verificationDigits.join('');
    if (code.length !== 4) {
      Toast.show({ type: 'error', text1: 'Enter all 4 digits' });
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post('http://10.21.161.3:8080/login/email_verification', {
        email: username,
        verificationCode: code,
      });
      setLoading(false);

      await AsyncStorage.setItem('resetToken', res.data.token);

      Toast.show({ type: 'success', text1: 'Verified ✅' });

      setTimeout(() => {
        navigation.navigate('NewPasswordScreen', { token: res.data.token });
      }, 2000);
    } catch (error) {
      setLoading(false);
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: error.response?.data?.message,
      });
    }
  };

  if (checkingLogin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <ImageBackground
          source={require('../assets/backimage.jpg')}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.overlay}
          >
            <Text style={styles.title}>Welcome</Text>
            <Text style={styles.subtitle}>
              {step === 'login'
                ? 'Sign in to continue'
                : step === 'forgotEmail'
                ? 'Reset your password'
                : 'Enter verification code'}
            </Text>
          </LinearGradient>
        </ImageBackground>

        <View style={styles.card}>
          {step === 'login' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#777"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#777"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
              <TouchableOpacity onPress={() => setStep('forgotEmail')}>
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleSignIn} style={{ marginTop: 10 }}>
                <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.button}>
                  <Text style={styles.buttonText}>
                    {loading ? 'Loading...' : 'Sign In →'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => navigation.navigate('SignupScreen')}
                style={styles.createAccountButton}
              >
                <Text style={styles.createAccountText}>Create an Account</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'forgotEmail' && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter your email"
                placeholderTextColor="#777"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={handleForgotPassword} style={{ marginTop: 10 }}>
                <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.button}>
                  <Text style={styles.buttonText}>
                    {loading ? 'Sending...' : 'Send Code'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}

          {step === 'verifyCode' && (
            <>
              <View style={styles.codeContainer}>
                {verificationDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputsRef.current[index] = ref)}
                    style={styles.codeInput}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleDigitChange(text, index)}
                  />
                ))}
              </View>
              <Text style={styles.timerText}>Time left: {formatTime()}</Text>
              <TouchableOpacity onPress={handleVerifyCode} style={{ marginTop: 20 }}>
                <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.button}>
                  <Text style={styles.buttonText}>
                    {loading ? 'Verifying...' : 'Verify'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </>
          )}
        </View>

        <Toast />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f7' },
  backgroundImage: { height: '38%', width: '100%' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  title: { color: '#fff', fontSize: 30, fontWeight: '700' },
  subtitle: { color: '#e0e0e0', fontSize: 16, marginTop: 6 },
  card: {
    backgroundColor: '#fff',
    marginTop: -35,
    marginHorizontal: 20,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  input: {
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    paddingHorizontal: 14,
    backgroundColor: '#fafafa',
    fontSize: 15,
    marginBottom: 15,
    color: '#000',
  },
  forgotText: { textAlign: 'right', color: '#2e7d32', marginBottom: 15, fontSize: 13 },
  button: { height: 50, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  codeContainer: { flexDirection: 'row', justifyContent: 'center', marginBottom: 15 },
  codeInput: {
    width: 50,
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    textAlign: 'center',
    fontSize: 20,
    marginHorizontal: 5,
    backgroundColor: '#fafafa',
    color: '#000',
  },
  timerText: { color: '#555', textAlign: 'center', marginTop: 5 },
  createAccountButton: {
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
  },
  createAccountText: { color: '#2e7d32', fontSize: 15, fontWeight: '500' },
});


