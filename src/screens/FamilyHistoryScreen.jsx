import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Dimensions, Animated, Easing, Alert } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur';
import { userData } from '../Services/UserData';
import { BASE_URL } from '../config/Api';
import Toast from 'react-native-toast-message';

const { width } = Dimensions.get('window');

const FamilyHistoryScreen = () => {
  const [selectedConditions, setSelectedConditions] = useState([]);
  const navigation = useNavigation();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  const familyConditions = ['Hereditary Baldness', 'Pattern Hair Loss', 'Thinning Hair', 'Premature Graying', 'Dandruff Issues', 'Scalp Conditions'];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: width * 0.9, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: false }),
    ]).start();
  }, []);

  const animateSelection = (condition) => {
    let updated;
    if (selectedConditions.includes(condition)) {
      updated = selectedConditions.filter((item) => item !== condition);
    } else {
      updated = [...selectedConditions, condition];
    }
    setSelectedConditions(updated);
    userData.family_history = updated.join(', ');
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }),
    ]).start();
  };

const confirmHandler = async () => {
  try {
    const response = await fetch(`${BASE_URL}/user/UserPrimaryDetails`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData),
    });

    const text = await response.text();
    const data = text ? JSON.parse(text) : {};

    if (response.ok) {
      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: 'Data submitted successfully!',
        position: 'bottom',
        visibilityTime: 3000,
      });
      navigation.navigate('Scanner'); // next screen
    } else {
      Toast.show({
        type: 'error',
        text1: 'Error',
        text2: data.message || 'Something went wrong',
        position: 'bottom',
        visibilityTime: 3000,
      });
    }
  } catch (error) {
    Toast.show({
      type: 'error',
      text1: 'Error',
      text2: error.message,
      position: 'bottom',
      visibilityTime: 3000,
    });
  }
};











  return (
    <LinearGradient colors={['#e8f5e9', '#ffffff']} style={styles.container}>
      <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={8} reducedTransparencyFallbackColor="white" />
      <View style={styles.progressWrapper}>
        <Animated.View style={[styles.progressBar, { width: progressAnim }]} />
      </View>
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <Text style={styles.title}>Family Hair History</Text>
        <Text style={styles.subtitle}>Select any family hair conditions to help us analyze genetic predispositions</Text>
      </Animated.View>

      <ScrollView style={styles.scrollContainer} contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        {familyConditions.map((condition) => (
          <Animated.View key={condition} style={{ transform: [selectedConditions.includes(condition) ? { scale: scaleAnim } : { scale: 1 }], opacity: fadeAnim }}>
            <TouchableOpacity style={[styles.option, selectedConditions.includes(condition) ? styles.selectedOption : styles.unselectedOption]} activeOpacity={0.9} onPress={() => animateSelection(condition)}>
              <Text style={[styles.optionText, selectedConditions.includes(condition) && styles.selectedText]}>{condition}</Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity style={[styles.confirmButton, selectedConditions.length === 0 && styles.disabledButton]} activeOpacity={0.9} onPress={confirmHandler} disabled={selectedConditions.length === 0}>
          <Text style={styles.confirmText}>Confirm</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60 },
  progressWrapper: { height: 8, backgroundColor: '#c8e6c9', borderRadius: 10, overflow: 'hidden', marginBottom: 40 },
  progressBar: { height: '100%', backgroundColor: '#2e7d32', borderRadius: 10 },
  title: { fontSize: 26, fontWeight: '600', color: '#2e7d32', marginBottom: 8, textAlign: 'center' },
  subtitle: { fontSize: 15, color: '#4f4f4f', textAlign: 'center', marginBottom: 30, lineHeight: 20 },
  scrollContainer: { flex: 1, marginTop: 10 },
  option: { backgroundColor: 'rgba(241, 248, 233, 0.8)', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 25, borderWidth: 1.5, borderColor: '#c8e6c9', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, marginBottom: 20 },
  selectedOption: { backgroundColor: 'rgba(165, 214, 167, 0.9)', borderColor: '#2e7d32', shadowOpacity: 0.15 },
  unselectedOption: {},
  optionText: { fontSize: 18, color: '#2e7d32' },
  selectedText: { fontWeight: '600' },
  confirmButtonContainer: { position: 'absolute', bottom: 20, left: 25, right: 25, alignItems: 'center' },
  confirmButton: { backgroundColor: '#2e7d32', paddingVertical: 16, borderRadius: 30, alignItems: 'center', width: '100%', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  disabledButton: { opacity: 0.6 },
  confirmText: { fontSize: 18, fontWeight: '600', color: '#fff' },
});

export default FamilyHistoryScreen;
