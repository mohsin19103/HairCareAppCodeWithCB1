import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  Animated,
  Modal,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { BlurView } from "@react-native-community/blur";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");

const OnboardS = () => {
  const navigation = useNavigation();
  const fadeAnim = useState(new Animated.Value(0))[0];
  const translateX = useState(new Animated.Value(width))[0];
  const [logoutVisible, setLogoutVisible] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // ✅ Logout Handler
  const confirmLogout = async () => {
    await AsyncStorage.removeItem("token");
    setLogoutVisible(false);
    navigation.reset({
      index: 0,
      routes: [{ name: "LoginScreen" }],
    });
  };

  // ✅ Back Handler
  const handleBack = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(translateX, {
        toValue: -width,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start(() => {
      navigation.goBack();
    });
  };
  const Report =()=>{
    navigation.navigate("Report")
  }
  const profileScreen =()=>{
    navigation.navigate("profileScreen")
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient
        colors={["#f0fdf4", "#e8f5e9", "#f9f9f9"]}
        style={styles.absolute}
      />
      <BlurView
        style={styles.absolute}
        blurType="light"
        blurAmount={12}
        reducedTransparencyFallbackColor="white"
      />

      <Animated.View
        style={[
          styles.container,
          { opacity: fadeAnim, transform: [{ translateX }] },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.headerIcon}>
            <Icon name="chevron-left" size={22} color="#2e7d32" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Options */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("profileScreen")}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <FontAwesome name="user" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.optionText}>User Profile</Text>
            <Icon name="chevron-right" size={20} color="#bdbdbd" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("Report")}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon name="file-text" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.optionText}>Report</Text>
            <Icon name="chevron-right" size={20} color="#bdbdbd" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.option}
            onPress={() => navigation.navigate("Feedback")}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <Icon name="message-circle" size={20} color="#0288d1" />
            </View>
            <Text style={styles.optionText}>Feedback</Text>
            <Icon name="chevron-right" size={20} color="#bdbdbd" />
          </TouchableOpacity>
        </View>

        {/* Logout Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.option}
            onPress={() => setLogoutVisible(true)}
            activeOpacity={0.7}
          >
            <View style={[styles.iconWrapper, { backgroundColor: "#ffebee" }]}>
              <Icon name="log-out" size={20} color="#780b09ff" />
            </View>
            <Text style={[styles.optionText, { color: "#e53935" }]}>
              Logout
            </Text>
            <Icon name="chevron-right" size={20} color="#ef9a9a" />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* ✅ Professional Logout Modal */}
      <Modal
        visible={logoutVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setLogoutVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>Confirm Logout</Text>
            <Text style={styles.modalMessage}>
              Are you sure you want to log out?
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setLogoutVisible(false)}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.modalButton, styles.logoutButton]}
                onPress={confirmLogout}
              >
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f9f9f9",
  },
  absolute: {
    position: "absolute",
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
  container: {
    flex: 1,
    paddingHorizontal: width * 0.05,
    paddingTop: Platform.OS === "android" ? height * 0.02 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#e0e0e0",
  },
  headerText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2e7d32",
  },
  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  section: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 14,
    marginTop: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 14,
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  optionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
    marginLeft: 12,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
  },
  // ✅ Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    width: width * 0.8,
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 10,
  },
  modalMessage: {
    fontSize: 15,
    color: "#444",
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  modalButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginLeft: 10,
  },
  cancelButton: {
    backgroundColor: "#f0f0f0",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#555",
  },
  logoutButton: {
    backgroundColor: "#e53935",
  },
  logoutText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
});

export default OnboardS;
