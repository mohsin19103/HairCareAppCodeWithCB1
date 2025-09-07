// Feedback.js
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  SafeAreaView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Feather';
import FA from 'react-native-vector-icons/FontAwesome';
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { height } = Dimensions.get('window');
const API_BASE_URL = 'http://172.20.10.4:8080';

const Feedback = () => {
  const navigation = useNavigation();

  // form state
  const [feedbackType, setFeedbackType] = useState(null); // 'App' | 'AI'
  const [comments, setComments] = useState('');
  const [rating, setRating] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!feedbackType) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select feedback type.' });
      return false;
    }
    if (!comments.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter your feedback.' });
      return false;
    }
    if (rating < 1) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please add a star rating.' });
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!validate()) return;

    try {
      setSubmitting(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Toast.show({ type: 'error', text1: 'Not signed in', text2: 'Please login again.' });
        await AsyncStorage.setItem('hasLoggedOut', 'true');
        await AsyncStorage.setItem('isLoggedIn', 'false');
        navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
        return;
      }

      const payload = {
        type: feedbackType, // 'App' or 'AI'
        rating,
        comments: comments.trim(),
      };

      await axios.post(`${API_BASE_URL}/user/feedback`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      Toast.show({ type: 'success', text1: 'Thank you!', text2: 'Feedback submitted.' });

      setComments('');
      setRating(0);
      setFeedbackType(null);

      setTimeout(() => navigation.goBack(), 700);
    } catch (error) {
      const status = error?.response?.status;
      const msg =
        error?.response?.data?.message ||
        (status === 401 ? 'Session expired. Please login again.' : 'Something went wrong.');

      Toast.show({ type: 'error', text1: 'Submission failed', text2: msg });

      if (status === 401) {
        await AsyncStorage.multiRemove(['token', 'isLoggedIn']);
        navigation.reset({ index: 0, routes: [{ name: 'LoginScreen' }] });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Feedback</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Icon name="x" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Type Selector */}
        <Text style={styles.label}>Select Feedback Type</Text>
        <View style={styles.typeRow}>
          {['App', 'AI'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                feedbackType === t && { backgroundColor: '#2e7d32' },
              ]}
              onPress={() => setFeedbackType(t)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  feedbackType === t && { color: '#fff' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* show form only after selecting type */}
        {feedbackType && (
          <>
            {/* Rating */}
            <Text style={styles.label}>Rate the {feedbackType}</Text>
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.8}>
                  <FA
                    name={i <= rating ? 'star' : 'star-o'}
                    size={30}
                    style={styles.starIcon}
                    color={i <= rating ? '#2e7d32' : '#9e9e9e'}
                  />
                </TouchableOpacity>
              ))}
            </View>

            {/* Comments */}
            <Text style={styles.label}>Your Feedback</Text>
            <TextInput
              style={styles.input}
              placeholder={`Write your ${feedbackType} feedback...`}
              placeholderTextColor="#81c784"
              multiline
              value={comments}
              onChangeText={setComments}
            />

            {/* Submit */}
            <TouchableOpacity
              style={[styles.button, submitting && { opacity: 0.7 }]}
              onPress={handleSubmit}
              disabled={submitting}
              activeOpacity={0.85}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#e8f5e9' },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: Platform.OS === 'android' ? 30 : 0 },
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, marginTop: 10,
  },
  headerText: { fontSize: 22, fontWeight: 'bold', color: '#2e7d32' },
  headerIcon: { padding: 5 },
  label: { fontSize: 16, color: '#2e7d32', marginBottom: 8, fontWeight: '500' },

  // type buttons
  typeRow: { flexDirection: 'row', marginBottom: 20 },
  typeButton: {
    flex: 1,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2e7d32',
    paddingVertical: 12,
    alignItems: 'center',
    marginRight: 10,
    backgroundColor: '#fff',
  },
  typeButtonText: { fontSize: 15, fontWeight: '600', color: '#2e7d32' },

  starsRow: { flexDirection: 'row', marginBottom: 16 },
  starIcon: { marginRight: 8 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#a5d6a7',
    padding: 14,
    fontSize: 16,
    color: '#000',
    minHeight: height * 0.18,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});

export default Feedback;