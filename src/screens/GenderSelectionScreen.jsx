import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import { useNavigation } from '@react-navigation/native';
import { userData } from '../Services/UserData';

const { width } = Dimensions.get('window');

const GenderSelectionScreen = () => {
  const [selectedGender, setSelectedGender] = useState('Male');
  const navigation = useNavigation();

  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.timing(progressAnim, { toValue: width * 0.25, duration: 800, easing: Easing.out(Easing.ease), useNativeDriver: false })
    ]).start();
  }, []);

  const animateSelection = (gender) => {
    setSelectedGender(gender);
    userData.gender = gender; // save gender to userData
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const ageHandler = () => {
    navigation.navigate('AgeSelectionScreen');
  };

  return (
    <View style={{ flex: 1 }}>
      <LinearGradient colors={['#e8f5e9', '#ffffff']} style={StyleSheet.absoluteFill} />
      <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={20} reducedTransparencyFallbackColor="white" />

      <View style={styles.container}>
        <View style={styles.progressWrapper}>
          <Animated.View style={[styles.progressBar, { width: progressAnim }]} />
        </View>

        <View style={styles.contentWrapper}>
          <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY }] }]}>
            <Text style={styles.title}>Choose your Gender</Text>
            <Text style={styles.subtitle}>This helps us personalize your experience</Text>
          </Animated.View>

          <View style={styles.optionsWrapper}>
            {['Male', 'Female'].map((gender) => (
              <Animated.View key={gender} style={{ transform: [selectedGender === gender ? { scale: scaleAnim } : { scale: 1 }], opacity: fadeAnim }}>
                <TouchableOpacity
                  style={[styles.option, selectedGender === gender && styles.selectedOption]}
                  activeOpacity={0.9}
                  onPress={() => animateSelection(gender)}
                >
                  <Text style={[styles.optionText, selectedGender === gender && styles.selectedText]}>{gender}</Text>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        </View>

        <View style={styles.bottomButtonWrapper}>
          <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
            <TouchableOpacity style={styles.confirmButton} activeOpacity={0.9} onPress={ageHandler}>
              <Text style={styles.confirmText}>Next</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 25, paddingTop: 60, justifyContent: 'space-between' },
  progressWrapper: { height: 8, backgroundColor: '#c8e6c9', borderRadius: 10, overflow: 'hidden', marginBottom: 50 },
  progressBar: { height: '100%', backgroundColor: '#2e7d32', borderRadius: 10 },
  contentWrapper: { flex: 1 },
  header: { marginBottom: 40, alignItems: 'center', paddingHorizontal: 20 },
  title: { fontSize: 26, fontWeight: '600', color: '#2e7d32', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#4f4f4f', textAlign: 'center', lineHeight: 20 },
  optionsWrapper: { gap: 20, marginTop: 20 },
  option: { backgroundColor: 'rgba(241, 248, 233, 0.8)', borderRadius: 20, paddingVertical: 20, paddingHorizontal: 25, borderWidth: 1.5, borderColor: '#c8e6c9', shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, alignItems: 'center' },
  selectedOption: { backgroundColor: 'rgba(165, 214, 167, 0.9)', borderColor: '#2e7d32', shadowOpacity: 0.15 },
  optionText: { fontSize: 18, color: '#2e7d32' },
  selectedText: { fontWeight: '600' },
  bottomButtonWrapper: { paddingBottom: 30 },
  confirmButton: { backgroundColor: '#2e7d32', paddingVertical: 16, borderRadius: 30, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  confirmText: { fontSize: 18, fontWeight: '600', color: '#fff' },
});

export default GenderSelectionScreen;
