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
  Animated,
  Easing,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/Api';

const LoginScreen = () => {
  const navigation = useNavigation();
  const url = BASE_URL;
  const [step, setStep] = useState('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputsRef = useRef([]);
  const [loading, setLoading] = useState(false);
  const [checkingLogin, setCheckingLogin] = useState(true);
  const [resetToken, setResetToken] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  useEffect(() => {
    if (step === 'verifyCode' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Animate on step change
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(50);
    scaleAnim.setValue(0.9);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  // Pulse animation for timer
  useEffect(() => {
    if (step === 'verifyCode' && timeLeft <= 60) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
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

        await AsyncStorage.setItem('token', authToken);
        await AsyncStorage.setItem('user', JSON.stringify(userData));
        await AsyncStorage.setItem('isLoggedIn', 'true');
        await AsyncStorage.setItem('hasLoggedOut', 'false');

        Toast.show({ type: 'success', text1: 'Login Successful', text2: 'Welcome back 👋' });

        navigation.reset({
          index: 0,
          routes: [{ name: 'GenderSelectionScreen' }],
        });
      }
    } catch (error) {
      console.error(error);
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
      await axios.post(`${url}/login/forgotPassword`, { email: username });
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
      const res = await axios.post(`${url}/login/email_verification`, {
        email: username,
        verificationCode: code,
      });
      setLoading(false);

      console.log('✅ Verification Response:', res.data);
      
      if (res.data.token) {
        const token = res.data.token.replace('Bearer ', '').trim();
        setResetToken(token);
        
        console.log('✅ Token stored:', token);
        
        Toast.show({ type: 'success', text1: 'Verified ✅' });
        setStep('newPassword');
        setVerificationDigits(['', '', '', '']);
      } else {
        Toast.show({
          type: 'error',
          text1: 'No token received',
          text2: 'Please try again',
        });
      }
    } catch (error) {
      setLoading(false);
      console.error('❌ Verification Error:', error.response?.data || error.message);
      Toast.show({
        type: 'error',
        text1: 'Verification failed',
        text2: error.response?.data?.message || error.message,
      });
    }
  };

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      Toast.show({ type: 'error', text1: 'Please fill in all fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      Toast.show({ type: 'error', text1: 'Passwords do not match' });
      return;
    }

    if (newPassword.length < 6) {
      Toast.show({ type: 'error', text1: 'Password must be at least 6 characters' });
      return;
    }

    if (!resetToken) {
      Toast.show({ 
        type: 'error', 
        text1: 'Session expired',
        text2: 'Please restart the password reset process'
      });
      setStep('forgotEmail');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🔐 Attempting password reset...');
      console.log('📧 Email:', username);
      console.log('🎫 Token:', resetToken);
      
      const config = {
        headers: {
          'Authorization': `Bearer ${resetToken}`,
          'Content-Type': 'application/json'
        }
      };

      console.log('📤 Request Headers:', config.headers);
      
      const res = await axios.post(
        `${url}/login/newPassword`,
        { NewPassword: newPassword },
        config
      );

      console.log('✅ Password Reset Response:', res.status, res.data);

      if (res.status === 200 || res.status === 201) {
        Toast.show({ 
          type: 'success', 
          text1: 'Password reset successful! 🎉',
          text2: 'You can now login with your new password'
        });

        setStep('login');
        setUsername('');
        setPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setResetToken('');
        setVerificationDigits(['', '', '', '']);
      }
    } catch (error) {
      console.error('❌ Password Reset Error:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
        config: error.config
      });
      
      let errorMessage = 'Something went wrong';
      
      if (error.response?.status === 401) {
        errorMessage = 'Invalid or expired token. Please restart password reset.';
        setStep('forgotEmail');
        setResetToken('');
      } else if (error.response?.status === 400) {
        errorMessage = error.response?.data?.message || 'Invalid request';
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message.includes('Network')) {
        errorMessage = 'Network error. Please check your connection.';
      }
      
      Toast.show({
        type: 'error',
        text1: 'Password reset failed',
        text2: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (checkingLogin) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f7' }}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={{ marginTop: 15, color: '#666', fontSize: 15 }}>Loading...</Text>
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
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.7)']}
            style={styles.overlay}
          >
            <Animated.View style={{ opacity: fadeAnim }}>
              <Text style={styles.title}>Welcome</Text>
              <Text style={styles.subtitle}>
                {step === 'login'
                  ? 'Sign in to continue'
                  : step === 'forgotEmail'
                  ? 'Reset your password'
                  : step === 'verifyCode'
                  ? 'Enter verification code'
                  : 'Create new password'}
              </Text>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>

        <Animated.View 
          style={[
            styles.card,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          {step === 'login' && (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter your password"
                    placeholderTextColor="#999"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowPassword(!showPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIconText}>
                      {showPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity 
                onPress={() => setStep('forgotEmail')}
                activeOpacity={0.7}
              >
                <Text style={styles.forgotText}>Forgot your password?</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleSignIn} 
                style={styles.buttonWrapper}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={loading ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Sign In →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity
                onPress={() => navigation.navigate('SignupScreen')}
                style={styles.createAccountButton}
                activeOpacity={0.7}
              >
                <Text style={styles.createAccountText}>Create New Account</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'forgotEmail' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>🔒</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Reset Password</Text>
              <Text style={styles.sectionDescription}>
                Enter your email address and we'll send you a verification code to reset your password.
              </Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor="#999"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
              </View>

              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.buttonWrapper}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={loading ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Verification Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setStep('login')} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to Login</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'verifyCode' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>📧</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Verify Your Email</Text>
              <Text style={styles.sectionDescription}>
                We've sent a 4-digit code to{'\n'}
                <Text style={styles.highlightText}>{username}</Text>
              </Text>
              
              <View style={styles.codeContainer}>
                {verificationDigits.map((digit, index) => (
                  <TextInput
                    key={index}
                    ref={(ref) => (inputsRef.current[index] = ref)}
                    style={[
                      styles.codeInput,
                      digit && styles.codeInputFilled
                    ]}
                    keyboardType="numeric"
                    maxLength={1}
                    value={digit}
                    onChangeText={(text) => handleDigitChange(text, index)}
                  />
                ))}
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={[
                  styles.timerText,
                  timeLeft <= 60 && styles.timerWarning
                ]}>
                  ⏱️ {formatTime()}
                </Text>
              </Animated.View>

              <TouchableOpacity 
                onPress={handleVerifyCode} 
                style={styles.buttonWrapper}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={loading ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Verify Code</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleForgotPassword} 
                style={styles.resendButton}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.resendText}>Didn't receive code? Resend</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setStep('forgotEmail')} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Use different email</Text>
              </TouchableOpacity>
            </>
          )}

          {step === 'newPassword' && (
            <>
              <View style={styles.iconContainer}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconEmoji}>🔑</Text>
                </View>
              </View>
              <Text style={styles.sectionTitle}>Create New Password</Text>
              <Text style={styles.sectionDescription}>
                Your new password must be different from previously used passwords.
              </Text>
              
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>New Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Enter new password"
                    placeholderTextColor="#999"
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showNewPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowNewPassword(!showNewPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIconText}>
                      {showNewPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={[styles.input, styles.passwordInput]}
                    placeholder="Confirm new password"
                    placeholderTextColor="#999"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity 
                    style={styles.eyeIcon}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.eyeIconText}>
                      {showConfirmPassword ? '🙈' : '👁️'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.requirementsContainer}>
                <Text style={styles.requirementsTitle}>Password Requirements:</Text>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkCircle,
                    newPassword.length >= 6 && styles.checkCircleMet
                  ]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <Text style={[
                    styles.requirementText,
                    newPassword.length >= 6 && styles.requirementMet
                  ]}>At least 6 characters</Text>
                </View>
                <View style={styles.requirementRow}>
                  <View style={[
                    styles.checkCircle,
                    newPassword === confirmPassword && newPassword && styles.checkCircleMet
                  ]}>
                    <Text style={styles.checkMark}>✓</Text>
                  </View>
                  <Text style={[
                    styles.requirementText,
                    newPassword === confirmPassword && newPassword && styles.requirementMet
                  ]}>Passwords match</Text>
                </View>
              </View>

              <TouchableOpacity 
                onPress={handleResetPassword} 
                style={styles.buttonWrapper}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={loading ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.button}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity 
                onPress={() => {
                  setStep('verifyCode');
                  setNewPassword('');
                  setConfirmPassword('');
                }} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Back to verification</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>

        <Toast />
      </View>
    </KeyboardAvoidingView>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f7' 
  },
  backgroundImage: { 
    height: '40%', 
    width: '100%' 
  },
  overlay: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  title: { 
    color: '#fff', 
    fontSize: 36, 
    fontWeight: '800',
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: { 
    color: '#e8f5e9', 
    fontSize: 16, 
    marginTop: 8,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  card: {
    backgroundColor: '#fff',
    marginTop: -40,
    marginHorizontal: 20,
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 8,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  iconEmoji: {
    fontSize: 32,
  },
  sectionTitle: {
    color: '#1b5e20',
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  sectionDescription: {
    color: '#666',
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 22,
  },
  highlightText: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  input: {
    height: 54,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    paddingHorizontal: 16,
    backgroundColor: '#fafafa',
    fontSize: 15,
    color: '#000',
  },
  passwordContainer: {
    position: 'relative',
  },
  passwordInput: {
    paddingRight: 50,
    marginBottom: 0,
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    top: 14,
    padding: 8,
  },
  eyeIconText: {
    fontSize: 20,
  },
  forgotText: { 
    textAlign: 'right', 
    color: '#2e7d32', 
    marginBottom: 20, 
    fontSize: 13,
    fontWeight: '600',
  },
  buttonWrapper: {
    marginTop: 4,
  },
  button: { 
    height: 54, 
    borderRadius: 14, 
    justifyContent: 'center', 
    alignItems: 'center',
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 12,
    color: '#999',
    fontSize: 13,
    fontWeight: '500',
  },
  codeContainer: { 
    flexDirection: 'row', 
    justifyContent: 'center', 
    marginBottom: 20,
    gap: 12,
  },
  codeInput: {
    width: 60,
    height: 60,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 14,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: '700',
    backgroundColor: '#fafafa',
    color: '#000',
  },
  codeInputFilled: {
    borderColor: '#2e7d32',
    backgroundColor: '#e8f5e9',
  },
  timerText: { 
    color: '#666', 
    textAlign: 'center', 
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 20,
  },
  timerWarning: {
    color: '#d32f2f',
  },
  createAccountButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f8f4',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c8e6c9',
  },
  createAccountText: { 
    color: '#2e7d32', 
    fontSize: 15, 
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  backButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  resendButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  requirementsContainer: {
    backgroundColor: '#f9fdf9',
    borderRadius: 14,
    padding: 16,
    marginTop: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  requirementsTitle: {
    color: '#333',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  checkCircleMet: {
    backgroundColor: '#2e7d32',
  },
  checkMark: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  requirementText: {
    color: '#999',
    fontSize: 13,
    flex: 1,
  },
  requirementMet: {
    color: '#2e7d32',
    fontWeight: '600',
  },
});