import React, { useEffect, useRef, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFetchBlob from 'react-native-blob-util';
import { config } from "../config";
import { BASE_URL } from "../config/Api";

const URL = BASE_URL;

const ResultsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const photos = route.params?.photos || [];
  const spinValue = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showError, setShowError] = useState(false);

  const testTokenRetrieval = async () => {
    try {
      const token = await AsyncStorage.getItem('token');
      console.log('Token result:', token);
    } catch (e) {
      console.error('Test error:', e);
    }
  };

  const uploadHairImages = async (analysisId, photos) => {
    try {
      const token = await AsyncStorage.getItem("token");
      if (!token) {
        console.log("❌ No token found");
        return;
      }

      console.log(`📤 Uploading ${photos.length} images for analysis ID: ${analysisId}`);

      // Upload each image separately since server expects 'imageFile' (singular)
      for (let index = 0; index < photos.length; index++) {
        const image = photos[index];
        const imagePath = image.path.replace('file://', '');
        
        console.log(`📸 Uploading image ${index + 1}/${photos.length}: ${imagePath}`);

        try {
          const response = await RNFetchBlob.fetch(
            'POST',
            `${URL}/api/ai-responses/uploadHairImage/${analysisId}`,
            {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'multipart/form-data',
            },
            [
              {
                name: 'imageFile', // Changed from 'images' to 'imageFile'
                filename: `hair_${index}.jpg`,
                type: 'image/jpeg',
                data: RNFetchBlob.wrap(imagePath)
              }
            ]
          );

          const responseData = response.json();
          console.log(`✅ Image ${index + 1} uploaded successfully:`, responseData);
        } catch (uploadError) {
          console.log(`❌ Failed to upload image ${index + 1}:`, uploadError);
          // Continue with other images even if one fails
        }
      }

      console.log("✅ All images upload process completed");
    } catch (err) {
      console.log("❌ Hair Upload Error:", err);
      console.log("Error details:", err.message);
    }
  };

  const saveAIResponseToBackend = async (aiResponse) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        console.log("❌ No token available for backend save");
        return null;
      }

      const payload = {
        result: aiResponse.result || {},
        processed_images: aiResponse.processed_images || photos.length,
        timestamp: new Date().toISOString(),
      };

      console.log("💾 Saving AI response to backend...");

      const response = await fetch(`${BASE_URL}/api/ai-responses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("✅ Backend save successful:", result);
        
        const analysisId = result?.id;
        if (analysisId) {
          console.log(`📋 Analysis ID received: ${analysisId}`);
          await uploadHairImages(analysisId, photos);
        } else {
          console.log("⚠️ No analysis ID in response");
        }
        
        return result;
      } else {
        const errorText = await response.text();
        console.log("❌ Backend save failed:", response.status, errorText);
        return null;
      }
    } catch (error) {
      console.log('❌ Save to backend exception:', error);
      console.log('Error message:', error.message);
      return null;
    }
  };

  const getResult = async () => {
    if (photos.length === 0) {
      setError("No photos to process");
      setShowError(true);
      setLoading(false);
      return;
    }

    try {
      console.log(`🚀 Starting AI analysis for ${photos.length} photos...`);
      
      const formData = new FormData();
      photos.forEach((image, index) => {
        formData.append('images', {
          uri: image.path,
          type: 'image/jpeg',
          name: `image_${index}.jpg`,
        });
      });

      const response = await fetch(`${config.AI_API_URL}/predict/image`, {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const result = await response.json();
      console.log("🤖 AI API Response:", result);

      if (result.error) {
        console.log("❌ AI returned error:", result.error);
        setError(result.error);
        setShowError(true);
        setLoading(false);
        return;
      }

      if (result.result) {
        console.log("✅ AI analysis successful, saving to backend...");
        await saveAIResponseToBackend(result);
        navigation.navigate('ResultScreen', { responseData: result });
      } else {
        throw new Error(result.message || 'Upload failed');
      }
    } catch (err) {
      console.log('❌ Upload Error:', err);
      console.log('Error details:', err.message);
      setError('An error occurred while processing your request. Please try again.');
      setShowError(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    testTokenRetrieval();
    
    // Start spinning animation
    Animated.loop(
      Animated.timing(spinValue, { 
        toValue: 1, 
        duration: 1500, 
        useNativeDriver: true 
      })
    ).start();
    
    // Fade in animation
    Animated.timing(fadeAnim, { 
      toValue: 1, 
      duration: 800, 
      useNativeDriver: true 
    }).start();
    
    // Start processing after 3 seconds
    const timer = setTimeout(() => { 
      setLoading(false); 
      getResult(); 
    }, 3000);

    return () => clearTimeout(timer); // Cleanup timer on unmount
  }, []);

  const spin = spinValue.interpolate({ 
    inputRange: [0, 1], 
    outputRange: ['0deg', '360deg'] 
  });

  const handleBackToCamera = () => {
    navigation.goBack();
  };

  return (
    <LinearGradient colors={["#e9fff3", "#ffffff"]} style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        {showError ? (
          <>
            <View style={styles.errorIconContainer}>
              <Text style={styles.errorIcon}>⚠️</Text>
            </View>
            <Text style={styles.errorTitle}>Processing Error</Text>
            <Text style={styles.errorMessage}>
              {error || "Please send a clear hair-only image"}
            </Text>
            <TouchableOpacity 
              style={styles.backToCameraButton} 
              onPress={handleBackToCamera}
            >
              <Text style={styles.backToCameraButtonText}>Back to Camera</Text>
            </TouchableOpacity>
          </>
        ) : (
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
    alignItems: "center" 
  },
  card: { 
    backgroundColor: "#fff", 
    width: "85%", 
    borderRadius: 20, 
    alignItems: "center", 
    padding: 30, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 3 }, 
    shadowOpacity: 0.1, 
    shadowRadius: 8, 
    elevation: 6 
  },
  loader: { 
    marginBottom: 20 
  },
  title: { 
    fontSize: 22, 
    fontWeight: "600", 
    color: "#0b8a46", 
    textAlign: "center" 
  },
  subtitle: { 
    fontSize: 16, 
    color: "#333", 
    textAlign: "center", 
    marginTop: 10 
  },
  errorIconContainer: { 
    marginBottom: 15 
  },
  errorIcon: { 
    fontSize: 40 
  },
  errorTitle: { 
    fontSize: 20, 
    fontWeight: "600", 
    color: "#ff4757" 
  },
  errorMessage: { 
    fontSize: 16, 
    color: "#555", 
    textAlign: "center", 
    marginVertical: 8 
  },
  backToCameraButton: { 
    marginTop: 15, 
    backgroundColor: "#0b8a46", 
    paddingVertical: 12, 
    paddingHorizontal: 25, 
    borderRadius: 30 
  },
  backToCameraButtonText: { 
    color: "#fff", 
    fontSize: 16, 
    fontWeight: "500" 
  },
});

export default ResultsScreen;