import React, { useEffect, useRef } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Animated, Easing } from "react-native";
import { useNavigation } from '@react-navigation/native';
import LinearGradient from "react-native-linear-gradient";

const ResultsScreen = () => {
  const navigation = useNavigation();
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 2000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    );
    animation.start();
    
    return () => animation.stop(); // Cleanup animation
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <LinearGradient 
      colors={["#1a052f", "#0d001a"]} 
      style={styles.container}
    >
      <View style={styles.resultContainer}>
        <Animated.View style={[styles.gearIcon, { transform: [{ rotate: spin }] }]}>
          <Text style={styles.gearText}>⚙️</Text>
        </Animated.View>
        
        <Text style={styles.resultTitle}>Coming Soon!</Text>
        <Text style={styles.resultText}>
          Our AI hair analysis feature is currently in development.
          {"\n\n"}We'll be launching this exciting functionality soon!
        </Text>
        
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>Back to Camera</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  gearIcon: {
    marginBottom: 30,
  },
  gearText: {
    fontSize: 80,
    textAlign: 'center',
  },
  resultTitle: {
    color: '#9c4dff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  resultText: {
    color: '#ccc',
    fontSize: 18,
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  backButton: {
    backgroundColor: '#9c4dff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 30,
  },
  backButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
});

export default ResultsScreen; // Changed to default export