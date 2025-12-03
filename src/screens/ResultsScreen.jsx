import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import { config } from "../config";

const ResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const photos = route.params?.photos || [];
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  const getResult = async () => {
    if (photos.length === 0) return;

    try {
      const formData = new FormData();
      photos.forEach((image, index) => {
        formData.append('images', {
          uri: `file://${image.path}`,
          type: 'image/jpeg',
          name: `image_${image.view}_${index}.jpg`,
        });
        formData.append(`view_${index}`, image.view);
      });

      console.log('📸 Sending images to API...');
      console.log('Number of photos:', photos.length);
      photos.forEach((photo, index) => {
        console.log(`Photo ${index + 1}:`, photo);
      });

      const response = await fetch(`${config.AI_API_URL}/predict/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const result = await response.json();
      
      console.log('🎯 FULL API RESPONSE:', JSON.stringify(result, null, 2));
      
      // Check for error in response
      if (result.error) {
        setError(result.error);
        setShowError(true);
        setLoading(false);
        return;
      }
      
      console.log('🔍 Disease:', result.result?.disease);
      console.log('📊 Confidence:', result.result?.confidence);
      console.log('📑 Sections:', Object.keys(result.result?.sections || {}));

      if (result.result) {
        let responseData = result;
        navigation.navigate('ResultScreen', { responseData });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (error) {
      console.log('❌ Upload Error:', error);
      setError('An error occurred while processing your request. Please try again.');
      setShowError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    // Start animations
    Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      })
    ).start();

    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Wait 3 seconds before API call
    const timer = setTimeout(() => {
      setLoading(false);
      getResult();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Handle back to camera
  const handleBackToCamera = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={["#e9fff3", "#ffffff"]} style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        
        {showError ? (
          // Error State UI - SHOWS BACK TO CAMERA BUTTON
          <>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            
            <Text style={styles.errorTitle}>Invalid Image</Text>
            
            <Text style={styles.errorMessage}>
              {error || "Found Irrelevant Objects in the photo, please do send the photo of your hairs only"}
            </Text>
            
            {/* BACK TO CAMERA BUTTON - ONLY SHOWS IN ERROR STATE */}
            <TouchableOpacity
              style={styles.backToCameraButton}
              onPress={handleBackToCamera}
            >
              <Text style={styles.backToCameraButtonText}>Back to Camera</Text>
            </TouchableOpacity>
          </>
        ) : (
          // Loading State UI - NO BACK TO CAMERA BUTTON
          <>
            <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
              <ActivityIndicator size="large" color="#00b894" />
            </Animated.View>

            <Text style={styles.title}>
              {loading ? "Analyzing..." : "Generating Results..."}
            </Text>
            <Text style={styles.subtitle}>
              Please wait while we process your {photos.length} image(s).
            </Text>

            {/* NO BUTTON HERE - User can't go back during processing */}
          </>
        )}
        
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#ffffff",
    width: "85%",
    borderRadius: 20,
    alignItems: "center",
    padding: 30,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 8,
  },
  loader: {
    marginBottom: 25,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#00b894",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
  },
  errorIconContainer: {
    marginBottom: 20,
  },
  errorIcon: {
    fontSize: 60,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ff6b6b",
    marginBottom: 15,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 40,
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  backToCameraButton: {
    backgroundColor: "#00b894",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    width: "100%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  backToCameraButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default ResultsScreen;