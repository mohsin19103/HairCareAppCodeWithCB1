import React, { useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Platform } from 'react-native';
import Video from 'react-native-video';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const StartScreen = ({ navigation }) => {
  const videoRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);

  // Handle video playback when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
      return () => {
        // Optional: Pause video when screen loses focus
        if (videoRef.current) {
          videoRef.current.pause();
        }
      };
    }, [])
  );

  const handleVideoLoad = () => {
    setIsVideoReady(true);
  };

  return (
    <View style={styles.container}>
      {/* Background Video */}
     
<Video
  ref={videoRef}
  source={require('../assets/video1.mp4')}
  style={styles.backgroundVideo}
  muted={true}
  repeat={true}
  resizeMode="cover"
  rate={1.0}
  ignoreSilentSwitch="obey"
  onLoad={handleVideoLoad}
  paused={!isVideoReady} // Changed this line
  playInBackground={false}
  playWhenInactive={false}
  hardwareAccelerated={true} // Added this line for Android
  bufferConfig={{
    minBufferMs: 15000,
    maxBufferMs: 30000,
    bufferForPlaybackMs: 2500,
    bufferForPlaybackAfterRebufferMs: 5000
  }}
/>

      {/* Dark overlay for better text visibility */}
      <View style={styles.overlay} />

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Smart Solutions, AI Precision</Text>
        <Text style={styles.caption}>Empowering the future with intelligent technology</Text>
        <TouchableOpacity
          style={styles.startButton}
          onPress={() => navigation.navigate('LoginScreen')}
          activeOpacity={0.7}
        >
          <Text style={styles.buttonText}>Let's Start</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundVideo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    zIndex: 0,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    zIndex: 1,
  },
  content: {
    alignItems: 'center',
    padding: width * 0.05,
    borderRadius: 10,
    zIndex: 2,
    width: '90%',
    maxWidth: 500,
  },
  title: {
    fontSize: width * 0.07,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: height * 0.02,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 5,
    lineHeight: width * 0.09,
  },
  caption: {
    fontSize: width * 0.04,
    color: 'white',
    textAlign: 'center',
    marginBottom: height * 0.05,
    lineHeight: width * 0.06,
  },
  startButton: {
    backgroundColor: 'rgba(31, 120, 13, 0.8)',
    paddingVertical: height * 0.015,
    paddingHorizontal: width * 0.1,
    borderRadius: 25,
    shadowColor: '#327018ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  buttonText: {
    fontSize: width * 0.045,
    color: 'white',
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});

export default StartScreen;