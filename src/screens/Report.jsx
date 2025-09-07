// Report.js
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
import Toast from 'react-native-toast-message';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

const { height } = Dimensions.get('window');
const API_BASE_URL = 'http://172.20.10.4:8080';

const Report = () => {
  const navigation = useNavigation();

  // form state
  const [reportType, setReportType] = useState(null); // 'App' | 'AI'
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    if (!reportType) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please select report type.' });
      return false;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Error', text2: 'Please enter description.' });
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
        type: reportType, // 'App' or 'AI'
        description: description.trim(),
      };

      await axios.post(`${API_BASE_URL}/user/report`, payload, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });

      Toast.show({ type: 'success', text1: 'Thank you!', text2: 'Report submitted.' });

      setDescription('');
      setReportType(null);

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
          <Text style={styles.headerText}>Report</Text>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerIcon}>
            <Icon name="x" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Type Selector */}
        <Text style={styles.label}>Select Report Type</Text>
        <View style={styles.typeRow}>
          {['App', 'AI'].map((t) => (
            <TouchableOpacity
              key={t}
              style={[
                styles.typeButton,
                reportType === t && { backgroundColor: '#2e7d32' },
              ]}
              onPress={() => setReportType(t)}
            >
              <Text
                style={[
                  styles.typeButtonText,
                  reportType === t && { color: '#fff' },
                ]}
              >
                {t}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* show form only after selecting type */}
        {reportType && (
          <>
            {/* Description */}
            <Text style={styles.label}>Describe the issue</Text>
            <TextInput
              style={styles.input}
              placeholder={`Write your ${reportType} report...`}
              placeholderTextColor="#81c784"
              multiline
              value={description}
              onChangeText={setDescription}
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

export default Report;
