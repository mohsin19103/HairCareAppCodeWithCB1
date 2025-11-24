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
    
    // ✅ YAHAN PAR RESULT CONSOLE PE PRINT HOGA
    console.log('🎯 FULL API RESPONSE:', JSON.stringify(result, null, 2));
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

  return (
    <LinearGradient colors={["#e9fff3", "#ffffff"]} style={styles.container}>
      <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
        <Animated.View style={[styles.loader, { transform: [{ rotate: spin }] }]}>
          <ActivityIndicator size="large" color="#00b894" />
        </Animated.View>

        <Text style={styles.title}>
          {loading ? "Analyzing..." : "Generating Results..."}
        </Text>
        <Text style={styles.subtitle}>
          Please wait while we process your {photos.length} image(s).
        </Text>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backText}>Back to Camera</Text>
        </TouchableOpacity>
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
  backButton: {
    backgroundColor: "#00b894",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 35,
  },
  backText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ResultsScreen;
