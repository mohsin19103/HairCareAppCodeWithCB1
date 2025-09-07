import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { BlurView } from '@react-native-community/blur'; // ✅ Added blur import

const { width } = Dimensions.get('window');

const AgeSelectionScreen = () => {
  const [selectedAge, setSelectedAge] = useState('');
  const navigation = useNavigation();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade-in + slide-up + progress bar fill
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, friction: 6, useNativeDriver: true }),
      Animated.timing(progressAnim, {
        toValue: width * 0.5,
        duration: 800,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false
      })
    ]).start();
  }, []);

  const animateSelection = (age) => {
    setSelectedAge(age);
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 1.05, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true })
    ]).start();
  };

  const pastConditionsHandler = () => {
    navigation.navigate('PastHairConditionsScreen');
  };

  const ageGroups = ['18-24', '25-34', '35-44', '45-54', '55+'];

  return (
    <LinearGradient colors={['#e8f5e9', '#ffffff']} style={styles.container}>
      
      {/* Blur Background Layer */}
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType="light"
        blurAmount={8}
        reducedTransparencyFallbackColor="white"
      />

      {/* Animated Progress Bar */}
      <View style={styles.progressWrapper}>
        <Animated.View style={[styles.progressBar, { width: progressAnim }]} />
      </View>

      {/* Title */}
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY }] }}>
        <Text style={styles.title}>Select Your Age Group</Text>
        <Text style={styles.subtitle}>
          This helps us provide age-appropriate recommendations
        </Text>
      </Animated.View>

      {/* Age Options */}
      <View style={styles.optionsContainer}>
        {ageGroups.map((age) => (
          <Animated.View
            key={age}
            style={{
              transform: [
                selectedAge === age ? { scale: scaleAnim } : { scale: 1 }
              ],
              opacity: fadeAnim
            }}
          >
            <TouchableOpacity
              style={[
                styles.option,
                selectedAge === age ? styles.selectedOption : styles.unselectedOption,
              ]}
              activeOpacity={0.9}
              onPress={() => animateSelection(age)}
            >
              <Text style={[styles.optionText, selectedAge === age && styles.selectedText]}>
                {age}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </View>

      {/* Fixed Bottom Button */}
      <View style={styles.confirmButtonContainer}>
        <TouchableOpacity
          style={[styles.confirmButton, !selectedAge && styles.disabledButton]}
          activeOpacity={0.9}
          onPress={pastConditionsHandler}
          disabled={!selectedAge}
        >
          <Text style={styles.confirmText}>Next</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 25,
    paddingTop: 60,
  },
  progressWrapper: {
    height: 8,
    backgroundColor: '#c8e6c9',
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 40,
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#2e7d32',
    borderRadius: 10,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: '#4f4f4f',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 20,
  },
  optionsContainer: {
    flex: 1,
    gap: 20,
    marginTop: 10,
  },
  option: {
    backgroundColor: 'rgba(241, 248, 233, 0.8)',
    borderRadius: 20,
    paddingVertical: 20,
    paddingHorizontal: 25,
    borderWidth: 1.5,
    borderColor: '#c8e6c9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  selectedOption: {
    backgroundColor: 'rgba(165, 214, 167, 0.9)',
    borderColor: '#2e7d32',
    shadowOpacity: 0.15,
  },
  unselectedOption: {},
  optionText: {
    fontSize: 18,
    color: '#2e7d32',
  },
  selectedText: {
    fontWeight: '600',
  },
  confirmButtonContainer: {
    position: 'absolute',
    bottom: 20,
    left: 25,
    right: 25,
    alignItems: 'center',
  },
  confirmButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  disabledButton: {
    opacity: 0.6,
  },
  confirmText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
});

export default AgeSelectionScreen;
