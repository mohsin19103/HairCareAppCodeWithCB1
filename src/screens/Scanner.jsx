import React, { useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons"; // ✅ Apple-style icons
import Video from "react-native-video";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");

const Scanner = () => {
  const navigation = useNavigation();
  const buttonScale = useRef(new Animated.Value(1)).current;

  const animatePress = (callback) => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScale, {
        toValue: 1,
        friction: 3,
        useNativeDriver: true,
      }),
    ]).start(() => callback && callback());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#e8f5e9", "#ffffff"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>Hair Scan</Text>
          <TouchableOpacity onPress={() => navigation.navigate("OnboardS")}>
            <Ionicons name="settings-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Video Section */}
        <View style={styles.videoContainer}>
          <Video
            source={require("../assets/video5.mp4")}
            style={styles.video}
            resizeMode="cover"
            repeat
            muted
            paused={false}
          />
        </View>

        {/* Description */}
        <Text style={styles.description}>
          Unlock personalized hair care insights to boost your hair health and
          prevent hair loss effortlessly!
        </Text>

        {/* Scan Button */}
        <View style={styles.buttonContainer}>
          <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
            <TouchableOpacity
              style={styles.scanButton}
              activeOpacity={0.9}
              onPress={() =>
                animatePress(() => navigation.navigate("CameraScreen"))
              }
            >
              <Text style={styles.scanButtonText}>Scan Your Hair</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="home-outline" size={26} color="#2e7d32" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Chatbot")}
            activeOpacity={0.8}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="leaf-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>weekly plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}
             onPress={() => navigation.navigate("UserHistory")}
            >
            <Ionicons name="person-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Hair History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="flask-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Products</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 30,
    marginTop: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  videoContainer: {
    width: "100%",
    height: height * 0.45,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 3,
  },
  video: {
    width: "100%",
    height: "100%",
  },
  description: {
    textAlign: "center",
    color: "#4f4f4f",
    fontSize: 16,
    marginBottom: 20,
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    alignItems: "center",
  },
  scanButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 30,
    width: width * 0.9,
    maxWidth: 350,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 1, height: 2 },
    textShadowRadius: 3,
  },
  navigationBar: {
    borderTopColor: "#a5d6a7",
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    bottom: 5,
    left: 20,
    right: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  navItem: {
    alignItems: "center",
    minWidth: 50,
  },
  navText: {
    color: "#4f4f4f",
    fontSize: 10,
    marginTop: 4,
  },
});

export default Scanner;
