// ResultsScreen.js - Complete with Backend Integration
import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { config } from "../config";

// Backend API base URL
const BASE_URL = "http://10.80.72.3:8080";

const ResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const photos = route.params?.photos || [];
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  // Debug function to test token retrieval
  const testTokenRetrieval = async () => {
    console.log('🧪 MANUAL TOKEN TEST STARTED');
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token result:', token);
      
      const allKeys = await AsyncStorage.getAllKeys();
      console.log('All keys:', allKeys);
      
      if (allKeys.length > 0) {
        const allData = await AsyncStorage.multiGet(allKeys);
        console.log('All AsyncStorage data:');
        allData.forEach(([key, value]) => {
          console.log(`  ${key}: ${value?.substring(0, 50)}...`);
        });
      }
    } catch (e) {
      console.error('Test error:', e);
    }
  };

  // Function to save AI response to backend
  const saveAIResponseToBackend = async (aiResponse) => {
    console.log('========================================');
    console.log('🚀 STARTING BACKEND SAVE PROCESS');
    console.log('========================================');
    
    try {
      // Step 1: Get token
      console.log('Step 1: Retrieving token from AsyncStorage...');
      const token = await AsyncStorage.getItem('token');
      
      console.log('Step 2: Token check result:', token ? `Token exists (${token.length} chars)` : 'Token is NULL or empty');
      
      if (!token) {
        console.log('Step 3: NO TOKEN - Checking all AsyncStorage keys...');
        const allKeys = await AsyncStorage.getAllKeys();
        console.log('All keys in AsyncStorage:', allKeys);
        
        if (allKeys.length === 0) {
          console.log('⚠️ AsyncStorage is completely empty!');
        }
        
        console.log('❌ ABORT: No auth token found, skipping backend save');
        return;
      }

      // Step 4: Prepare payload
      console.log('Step 4: Token found! Preparing payload...');
      const payload = {
        result: {
          disease: aiResponse.result?.disease || 'Unknown',
          confidence: aiResponse.result?.confidence || 0,
          sections: aiResponse.result?.sections || {},
          predicted_class_index: aiResponse.result?.predicted_class_index,
          predicted_label: aiResponse.result?.predicted_label,
          probabilities: aiResponse.result?.probabilities,
        },
        processed_images: aiResponse.processed_images || photos.length,
        timestamp: new Date().toISOString(),
      };

      console.log('Step 5: Payload prepared:', {
        disease: payload.result.disease,
        confidence: payload.result.confidence,
        processed_images: payload.processed_images,
      });

      // Step 6: Make API call
      console.log('Step 6: Making API call to:', `${BASE_URL}/api/ai-responses`);
      console.log('Authorization header:', `Bearer ${token.substring(0, 20)}...`);
      
      const response = await fetch(`${BASE_URL}/api/ai-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Step 7: Response received, status:', response.status);

      if (response.ok) {
        const result = await response.json();
        console.log('✅ SUCCESS: AI response saved to backend');
        console.log('Backend response:', result);
      } else {
        const errorText = await response.text();
        console.log('❌ FAILED: Backend returned error');
        console.log('Status:', response.status);
        console.log('Error:', errorText);
      }
    } catch (error) {
      console.log('❌ EXCEPTION: Error during backend save');
      console.error('Error details:', error);
    }
    
    console.log('========================================');
    console.log('🏁 BACKEND SAVE PROCESS COMPLETE');
    console.log('========================================');
  };

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

      console.log('📸 Sending images to AI API...');
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
        // Save AI response to backend
        await saveAIResponseToBackend(result);
        
        // Navigate to result screen
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
    // TEST TOKEN ON MOUNT
    testTokenRetrieval();
    
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