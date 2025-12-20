import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ImageBackground,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/Api';

const SignupScreen = () => {
  const navigation = useNavigation();

  const [step, setStep] = useState('signup'); // 'signup' or 'verify'
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    country: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [verificationDigits, setVerificationDigits] = useState(['', '', '', '']);
  const [timeLeft, setTimeLeft] = useState(300);
  const inputsRef = useRef([]);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 500,
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
  }, []);

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

  // Countdown Timer for verification
  useEffect(() => {
    if (step === 'verify' && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearInterval(timer);
    }
  }, [step, timeLeft]);

  // Pulse animation for timer warning
  useEffect(() => {
    if (step === 'verify' && timeLeft <= 60 && timeLeft > 0) {
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

  const handleInputChange = (name, value) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleDigitChange = (text, index) => {
    if (/^\d?$/.test(text)) {
      const updatedDigits = [...verificationDigits];
      updatedDigits[index] = text;
      setVerificationDigits(updatedDigits);
      if (text && index < 3) inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace' && !verificationDigits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleCreateAccount = async () => {
    if (!formData.firstName.trim() || !formData.lastName.trim() ||
        !formData.email.trim() || !formData.password || !formData.country.trim()) {
      Toast.show({
        type: 'error',
        text1: 'Missing Information',
        text2: 'Please fill all fields',
      });
      return;
    }

    if (formData.password.length < 6) {
      Toast.show({
        type: 'error',
        text1: 'Weak Password',
        text2: 'Password must be at least 6 characters',
      });
      return;
    }

    if (!/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(formData.email)) {
      Toast.show({
        type: 'error',
        text1: 'Invalid Email',
        text2: 'Please enter a valid email address',
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await axios.post(`${BASE_URL}/signup`, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        country: formData.country.trim()
      });

      if (response.status === 200 || response.status === 201) {
        Toast.show({
          type: 'success',
          text1: 'Account Created! 🎉',
          text2: 'Please verify your email',
        });

        // Move to verification step
        setStep('verify');
        setTimeLeft(300);
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

  const handleVerifyCode = async () => {
    const code = verificationDigits.join('');
    
    if (code.length !== 4) {
      Toast.show({ 
        type: 'error', 
        text1: 'Incomplete Code',
        text2: 'Please enter all 4 digits' 
      });
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('🔐 Verifying code...');
      console.log('📧 Email:', formData.email);
      console.log('🔢 Code:', code);

      const response = await axios.post(`${BASE_URL}/signup/email_verification`, {
        email: formData.email.trim().toLowerCase(),
        verificationCode: code,
      });

      console.log('✅ Verification Response:', response.data);

      if (response.status === 200 || response.status === 201) {
        const userData = response.data.user;
        const authToken = response.data.token;

        if (authToken && userData) {
          // Save user data and token
          await AsyncStorage.setItem('token', authToken);
          await AsyncStorage.setItem('user', JSON.stringify(userData));
          await AsyncStorage.setItem('isLoggedIn', 'true');
          await AsyncStorage.setItem('hasLoggedOut', 'false');

          Toast.show({ 
            type: 'success', 
            text1: 'Email Verified! ✅',
            text2: 'Welcome to the app!' 
          });

          // Navigate to main app
          setTimeout(() => {
            navigation.reset({
              index: 0,
              routes: [{ name: 'GenderSelectionScreen' }],
            });
          }, 500);
        }
      }
    } catch (error) {
      console.error('❌ Verification Error:', error.response?.data || error.message);
      
      let errorMessage = 'Verification failed';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.response?.status === 400) {
        errorMessage = 'Invalid verification code';
      }

      Toast.show({
        type: 'error',
        text1: 'Verification Failed',
        text2: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendCode = async () => {
    try {
      setIsLoading(true);
      
      await axios.post(`${BASE_URL}/signup`, {
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        country: formData.country.trim()
      });

      Toast.show({ 
        type: 'success', 
        text1: 'Code Resent! 📧',
        text2: 'Check your email for new code' 
      });

      setTimeLeft(300);
      setVerificationDigits(['', '', '', '']);
      inputsRef.current[0]?.focus();

    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Resend Failed',
        text2: error.response?.data?.message || 'Could not resend code',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    navigation.navigate('LoginScreen');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView 
        style={styles.container}
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
              <Text style={styles.title}>
                {step === 'signup' ? 'Create Account' : 'Verify Email'}
              </Text>
              <Text style={styles.subtitle}>
                {step === 'signup' ? 'Join us today' : 'Check your inbox'}
              </Text>
            </Animated.View>
          </LinearGradient>
        </ImageBackground>

        <Animated.View 
          style={[
            styles.formContainer,
            {
              opacity: fadeAnim,
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim }
              ]
            }
          ]}
        >
          <View style={styles.iconContainer}>
            <View style={styles.iconCircle}>
              <Text style={styles.iconEmoji}>
                {step === 'signup' ? '👤' : '📧'}
              </Text>
            </View>
          </View>

          {step === 'signup' ? (
            <>
              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>First Name</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="user" size={18} color="#2e7d32" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter first name"
                    placeholderTextColor="#999"
                    value={formData.firstName}
                    onChangeText={(text) => handleInputChange('firstName', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Last Name</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="user" size={18} color="#2e7d32" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter last name"
                    placeholderTextColor="#999"
                    value={formData.lastName}
                    onChangeText={(text) => handleInputChange('lastName', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Email Address</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="envelope" size={18} color="#2e7d32" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your email"
                    placeholderTextColor="#999"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={formData.email}
                    onChangeText={(text) => handleInputChange('email', text)}
                  />
                </View>
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Password</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="lock" size={18} color="#2e7d32" style={styles.icon} />
                  <TextInput
                    style={[styles.textInput, { flex: 1 }]}
                    placeholder="Create password"
                    placeholderTextColor="#999"
                    secureTextEntry={!showPassword}
                    value={formData.password}
                    onChangeText={(text) => handleInputChange('password', text)}
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

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Country</Text>
                <View style={styles.inputContainer}>
                  <FontAwesome name="globe" size={18} color="#2e7d32" style={styles.icon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter your country"
                    placeholderTextColor="#999"
                    value={formData.country}
                    onChangeText={(text) => handleInputChange('country', text)}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              {formData.password.length > 0 && (
                <View style={styles.requirementsContainer}>
                  <View style={styles.requirementRow}>
                    <View style={[
                      styles.checkCircle,
                      formData.password.length >= 6 && styles.checkCircleMet
                    ]}>
                      <Text style={styles.checkMark}>✓</Text>
                    </View>
                    <Text style={[
                      styles.requirementText,
                      formData.password.length >= 6 && styles.requirementMet
                    ]}>At least 6 characters</Text>
                  </View>
                </View>
              )}

              <TouchableOpacity 
                onPress={handleCreateAccount} 
                disabled={isLoading}
                activeOpacity={0.8}
                style={styles.buttonWrapper}
              >
                <LinearGradient 
                  colors={isLoading ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.signinButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signinText}>Create Account →</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.divider}>
                <View style={styles.dividerLine} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.dividerLine} />
              </View>

              <TouchableOpacity 
                onPress={handleLogin}
                activeOpacity={0.7}
                style={styles.loginButton}
              >
                <Text style={styles.loginText}>Already have an account? Login</Text>
              </TouchableOpacity>

              <Text style={styles.termsText}>
                By signing up, you agree to our{' '}
                <Text style={styles.termsLink}>Terms & Conditions</Text>
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.sectionTitle}>Enter Verification Code</Text>
              <Text style={styles.sectionDescription}>
                We've sent a 4-digit code to{'\n'}
                <Text style={styles.highlightText}>{formData.email}</Text>
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
                    onKeyPress={(e) => handleKeyPress(e, index)}
                    autoFocus={index === 0}
                  />
                ))}
              </View>

              <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                <Text style={[
                  styles.timerText,
                  timeLeft <= 60 && styles.timerWarning,
                  timeLeft === 0 && styles.timerExpired
                ]}>
                  {timeLeft > 0 ? `⏱️ ${formatTime()}` : '⏱️ Code Expired'}
                </Text>
              </Animated.View>

              <TouchableOpacity 
                onPress={handleVerifyCode} 
                style={styles.buttonWrapper}
                disabled={isLoading || timeLeft === 0}
                activeOpacity={0.8}
              >
                <LinearGradient 
                  colors={isLoading || timeLeft === 0 ? ['#9e9e9e', '#757575'] : ['#66bb6a', '#2e7d32']} 
                  style={styles.signinButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isLoading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.signinText}>
                      {timeLeft === 0 ? 'Code Expired' : 'Verify Email'}
                    </Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={handleResendCode} 
                style={styles.resendButton}
                disabled={isLoading || timeLeft > 240}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.resendText,
                  (isLoading || timeLeft > 240) && styles.resendTextDisabled
                ]}>
                  {isLoading ? 'Sending...' : timeLeft > 240 ? 'Resend available soon' : 'Resend Code'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity 
                onPress={() => setStep('signup')} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <Text style={styles.backButtonText}>← Change Email</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>
      <Toast />
    </KeyboardAvoidingView>
  );
};

export default SignupScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f7',
  },
  backgroundImage: {
    height: 280,
    width: '100%',
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  formContainer: {
    backgroundColor: '#fff',
    marginTop: -40,
    marginHorizontal: 20,
    marginBottom: 30,
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
    marginBottom: 20,
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
    marginBottom: 28,
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
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 54,
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
  },
  icon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#000',
  },
  eyeIcon: {
    padding: 8,
    marginLeft: 8,
  },
  eyeIconText: {
    fontSize: 20,
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
    marginBottom: 24,
  },
  timerWarning: {
    color: '#d32f2f',
  },
  timerExpired: {
    color: '#d32f2f',
    fontWeight: '700',
  },
  requirementsContainer: {
    backgroundColor: '#f9fdf9',
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e8f5e9',
  },
  requirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
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
  buttonWrapper: {
    marginTop: 8,
  },
  signinButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 54,
    borderRadius: 14,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  signinText: {
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
  loginButton: {
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#f1f8f4',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#c8e6c9',
  },
  loginText: {
    color: '#2e7d32',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  resendButton: {
    marginTop: 16,
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  resendTextDisabled: {
    color: '#999',
  },
  backButton: {
    marginTop: 12,
    alignItems: 'center',
    paddingVertical: 8,
  },
  backButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
  termsText: {
    textAlign: 'center',
    marginTop: 16,
    color: '#999',
    fontSize: 12,
    lineHeight: 18,
  },
  termsLink: {
    color: '#2e7d32',
    fontWeight: '600',
  },
});