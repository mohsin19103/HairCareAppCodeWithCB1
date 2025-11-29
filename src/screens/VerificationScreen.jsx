import React, { useEffect, useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ImageBackground,
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  Image
} from 'react-native';
import AntDesign from 'react-native-vector-icons/AntDesign';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation, useRoute } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config/Api';

const { width } = Dimensions.get('window');

const VerificationScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, verificationCodeFromServer = null } = route.params ?? {};
  const [verificationCode, setVerificationCode] = useState(['', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessTick, setShowSuccessTick] = useState(false);
  const [serverCodeVisible, setServerCodeVisible] = useState(!!verificationCodeFromServer);
  const [fadeAnim] = useState(new Animated.Value(0));
  const [resendTimer, setResendTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const inputs = useRef([]);

  // Timer
  useEffect(() => {
    let timer;
    if (resendTimer > 0) {
      timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
    } else {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [resendTimer]);

  // Prefill dev code
  useEffect(() => {
    if (verificationCodeFromServer) {
      setVerificationCode(verificationCodeFromServer.toString().split(''));
    }
  }, [verificationCodeFromServer]);

  // Success animation
  useEffect(() => {
    if (showSuccessTick) {
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      const t = setTimeout(() => {
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setShowSuccessTick(false);
          navigation.reset({ index: 0, routes: [{ name: 'GenderSelectionScreen' }] });
        });
      }, 2000);
      return () => clearTimeout(t);
    }
  }, [showSuccessTick, fadeAnim, navigation]);

  const handleCodeChange = (text, index) => {
    const numericText = text.replace(/[^0-9]/g, '');
    if (numericText.length > 1) return;
    const newCode = [...verificationCode];
    newCode[index] = numericText;
    setVerificationCode(newCode);
    if (numericText && index < 3) inputs.current[index + 1].focus();
  };

  const handleVerification = async () => {
    const code = verificationCode.join('');
    if (code.length !== 4) {
      Alert.alert('Error', 'Please enter the 4-digit verification code');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post('${ BASE_URL}/signup/email_verification', {
        email, verificationCode: code
      }, { timeout: 10000 });

      if (response.status === 200) {
        const token = response.data?.token ?? null;
        if (token) await AsyncStorage.setItem('authToken', token);
        setShowSuccessTick(true);
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.message || 'Verification failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    try {
      await axios.post('${ BASE_URL}/signup/resend_verification', { email });
      setResendTimer(30);
      setCanResend(false);
      Alert.alert('Success', 'Verification code resent');
    } catch {
      Alert.alert('Error', 'Failed to resend verification code');
    }
  };

  const handleGoogleLogin = () => {
    Alert.alert('Google Login', 'Google login flow will be implemented here.');
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={require('../assets/backimage.jpg')}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        <LinearGradient colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.6)']} style={styles.overlay}>
          <Text style={styles.title}>Verify Your Email</Text>
          <Text style={styles.subtitle}>We sent a verification code to {email}</Text>
          {serverCodeVisible && <Text style={styles.devCodeText}>Dev code: {verificationCodeFromServer}</Text>}
        </LinearGradient>
      </ImageBackground>

      <View style={styles.formContainer}>
        <View style={styles.codeContainer}>
          {[0, 1, 2, 3].map((index) => (
            <TextInput
              key={index}
              ref={(ref) => (inputs.current[index] = ref)}
              style={styles.codeInput}
              placeholder="•"
              placeholderTextColor="#aaa"
              value={verificationCode[index]}
              onChangeText={(text) => handleCodeChange(text, index)}
              keyboardType="numeric"
              maxLength={1}
              selectTextOnFocus
            />
          ))}
        </View>

        <TouchableOpacity onPress={handleVerification} disabled={isLoading}>
          <LinearGradient colors={['#66bb6a', '#2e7d32']} style={styles.signinButton}>
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <>
              <Text style={styles.signinText}>Verify</Text>
              <AntDesign name="arrowright" size={22} color="#fff" />
            </>}
          </LinearGradient>
        </TouchableOpacity>

        {/* Google Sign-In */}
        <TouchableOpacity style={styles.googleButton} onPress={handleGoogleLogin}>
          <Image source={require('../assets/back.jpg')} style={styles.googleIcon} />
          <Text style={styles.googleText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleResend} disabled={!canResend}>
          <Text style={[styles.resendText, !canResend && styles.resendDisabled]}>
            {canResend ? 'Resend Code' : `Resend in ${resendTimer}s`}
          </Text>
        </TouchableOpacity>

        {showSuccessTick && (
          <Animated.View style={[styles.tickOverlay, { opacity: fadeAnim }]}>
            <View style={styles.tickCircle}>
              <AntDesign name="check" size={48} color="#fff" />
            </View>
            <Text style={styles.tickText}>Verified</Text>
          </Animated.View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  backgroundImage: { height: '40%', width: '100%' },
  overlay: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 20 },
  title: { color: '#fff', fontSize: 26, fontWeight: '700', marginBottom: 8 },
  subtitle: { color: '#e0e0e0', fontSize: 16, textAlign: 'center' },
  devCodeText: { color: '#FFD700', fontSize: 14, marginTop: 10 },
  formContainer: {
    backgroundColor: '#fff', marginTop: -40, marginHorizontal: 20,
    borderRadius: 15, padding: 20, elevation: 5,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15, shadowRadius: 5
  },
  codeContainer: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 },
  codeInput: {
    width: 60, height: 60, borderWidth: 1, borderColor: '#c8e6c9',
    borderRadius: 12, backgroundColor: '#f5f5f5', textAlign: 'center',
    fontSize: 24, fontWeight: '600', color: '#000'
  },
  signinButton: {
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    height: 50, borderRadius: 25, marginBottom: 20
  },
  signinText: { color: '#fff', fontSize: 16, marginRight: 10, fontWeight: 'bold' },
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#fff', borderWidth: 1, borderColor: '#ddd',
    borderRadius: 25, height: 50, marginBottom: 15
  },
  googleIcon: { width: 22, height: 22, marginRight: 10 },
  googleText: { fontSize: 16, fontWeight: '500', color: '#555' },
  resendText: { textAlign: 'center', color: '#2e7d32', fontSize: 14 },
  resendDisabled: { color: '#aaa' },
  tickOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.95)', justifyContent: 'center',
    alignItems: 'center', borderRadius: 15
  },
  tickCircle: {
    width: 100, height: 100, borderRadius: 50, backgroundColor: '#2e7d32',
    alignItems: 'center', justifyContent: 'center', marginBottom: 20
  },
  tickText: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' }
});

export default VerificationScreen;
