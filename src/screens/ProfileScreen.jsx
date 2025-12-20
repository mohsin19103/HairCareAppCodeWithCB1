// ProfileScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Modal,
  Pressable,
  Dimensions,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/Feather";
import Toast from "react-native-toast-message";
import * as ImagePicker from "react-native-image-picker";
import axios from "axios";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import { BlurView } from "@react-native-community/blur";
import { BASE_URL } from "../config/Api";

const API_BASE_URL = BASE_URL;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Updated user data for hair care app
  const sampleUser = {
    first_name: "Lucas",
    last_name: "Bennett",
    email: "lucasbennett@gmail.com",
    gender: "Male",
    age: 32,
    country: "United States",
    hair_type: "Curly",
    scalp_condition: "Normal",
    hair_concerns: ["Dryness", "Frizz"],
    last_analysis_date: "2024-01-15",
    weekly_growth: "1.2cm",
    total_analyses: 8,
    recommended_products: [
      { name: "Moisturizing Shampoo", brand: "Olaplex" },
      { name: "Repair Mask", brand: "Kerastase" }
    ],
    status: "Active",
    imagePath: null,
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          setUser(sampleUser);
          await AsyncStorage.setItem("user", JSON.stringify(sampleUser));
        }
      } catch (error) {
        console.log("Error loading user:", error);
        setUser(sampleUser);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleImageUpload = async () => {
    ImagePicker.launchImageLibrary(
      { 
        mediaType: "photo", 
        quality: 0.8,
        maxWidth: 800,
        maxHeight: 800
      }, 
      async (response) => {
        if (response.didCancel) {
          console.log("User cancelled image picker");
          return;
        }
        
        if (response.errorMessage) {
          Toast.show({
            type: "error",
            text1: "Image error",
            text2: response.errorMessage,
            visibilityTime: 2000,
          });
          return;
        }

        const asset = response.assets?.[0];
        if (!asset) return;

        try {
          setUploading(true);
          
          const token = await AsyncStorage.getItem("token");
          
          const formData = new FormData();
          formData.append('imageFile', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
          });

          const uploadResponse = await axios.post(
            `${API_BASE_URL}/image/uploadImage`, 
            formData,
            {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          if (uploadResponse.data && uploadResponse.data.imagePath) {
            const updatedUser = { 
              ...user, 
              imagePath: uploadResponse.data.imagePath 
            };
            
            setUser(updatedUser);
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            
            Toast.show({
              type: "success",
              text1: "Profile updated",
              text2: "Image uploaded successfully!",
              visibilityTime: 2000,
            });
          } else {
            throw new Error("Invalid response from server");
          }
        } catch (err) {
          console.log("Upload error:", err);
          
          if (asset.uri) {
            const updatedUser = { ...user, imagePath: asset.uri };
            setUser(updatedUser);
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
            
            Toast.show({
              type: "success",
              text1: "Profile updated",
              text2: "Image saved locally!",
            });
          } else {
            Toast.show({
              type: "error",
              text1: "Upload failed",
              text2: "Try again later.",
              visibilityTime: 2000,
            });
          }
        } finally {
          setUploading(false);
          setModalVisible(false);
        }
      }
    );
  };

  const handleRemovePhoto = async () => {
    const updatedUser = { ...user, imagePath: null };
    setUser(updatedUser);
    await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
    Toast.show({
      type: "success",
      text1: "Photo removed",
      text2: "Your profile photo has been removed.",
      visibilityTime: 2000,
    });
    setModalVisible(false);
  };

  // Function to handle Record button press - navigates to UserHistory
  const handleRecordPress = () => {
    navigation.navigate("UserHistory");
  };

  const getImageSource = () => {
    if (!user || !user.imagePath) {
      return require("../assets/female.png");
    }
    
    if (typeof user.imagePath !== 'string') {
      return require("../assets/female.png");
    }
    
    if (user.imagePath.startsWith('file://')) {
      return { uri: user.imagePath };
    }
    
    if (user.imagePath.startsWith('http://') || user.imagePath.startsWith('https://')) {
      return { uri: user.imagePath };
    }
    
    if (user.imagePath.includes && user.imagePath.includes('D:/images/')) {
      const filename = user.imagePath.replace('D:/images/', '');
      return { uri: `${API_BASE_URL}/image/getImage?imagePath=images/${filename}` };
    }
    
    return require("../assets/female.png");
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={{ color: "#333" }}>No user data available</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header with Back Button */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Icon name="chevron-left" size={28} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Hair Profile</Text>
          <View style={{ width: 28 }} />
        </View>

        {/* Profile Info Section */}
        <View style={styles.profileSection}>
          <View style={styles.imageContainer}>
            <Image
              source={getImageSource()}
              style={styles.profileImage}
              onError={(e) => {
                console.log("Error loading image:", e.nativeEvent.error);
                return require("../assets/female.png");
              }}
            />
            {uploading && (
              <View style={styles.uploadOverlay}>
                <ActivityIndicator size="large" color="#fff" />
              </View>
            )}
            <TouchableOpacity
              style={styles.cameraIcon}
              onPress={() => setModalVisible(true)}
              disabled={uploading}
            >
              <FontAwesome5 name="camera" size={16} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{user.first_name || ''} {user.last_name || ''}</Text>
          <Text style={styles.userEmail}>{user.email || ''}</Text>
        </View>

        {/* Record Button - Now navigates to UserHistory */}
        <TouchableOpacity style={styles.recordButton} onPress={handleRecordPress}>
          <Icon name="clipboard" size={20} color="#fff" style={{ marginRight: 10 }} />
          <Text style={styles.recordButtonText}>View Hair History</Text>
        </TouchableOpacity>

        {/* Hair Analysis Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="bar-chart-2" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.statNumber}>{user.total_analyses || 0}</Text>
            <Text style={styles.statLabel}>Total Analyses</Text>
          </View>
          
          <View style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Icon name="trending-up" size={24} color="#2e7d32" />
            </View>
            <Text style={styles.statNumber}>{user.weekly_growth || '0cm'}</Text>
            <Text style={styles.statLabel}>Weekly Growth</Text>
          </View>
        </View>

        {/* Hair Details Section */}
        <View style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Hair Information</Text>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Hair Type</Text>
            <Text style={styles.detailValue}>{user.hair_type || 'Not Set'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Scalp Condition</Text>
            <Text style={styles.detailValue}>{user.scalp_condition || 'Not Set'}</Text>
          </View>
          
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Last Analysis</Text>
            <Text style={styles.detailValue}>{user.last_analysis_date || 'Never'}</Text>
          </View>
          
          {user.hair_concerns && user.hair_concerns.length > 0 && (
            <View style={styles.concernsContainer}>
              <Text style={styles.detailLabel}>Hair Concerns</Text>
              <View style={styles.concernsList}>
                {user.hair_concerns.map((concern, index) => (
                  <View key={index} style={styles.concernTag}>
                    <Text style={styles.concernText}>{concern}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Recommended Products Section */}
        {user.recommended_products && user.recommended_products.length > 0 && (
          <View style={styles.productsCard}>
            <Text style={styles.sectionTitle}>Recommended Products</Text>
            {user.recommended_products.map((product, index) => (
              <TouchableOpacity key={index} style={styles.productItem}>
                <View style={styles.productIcon}>
                  <Icon name="shopping-bag" size={20} color="#2e7d32" />
                </View>
                <View style={styles.productInfo}>
                  <Text style={styles.productName}>{product.name}</Text>
                  <Text style={styles.productBrand}>{product.brand}</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#999" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Weekly Growth Update Section */}
        <View style={styles.growthUpdateCard}>
          <Text style={styles.sectionTitle}>Weekly Growth Update</Text>
          
          <View style={styles.growthProgressContainer}>
            <View style={styles.growthProgressBar}>
              <View style={[styles.growthProgressFill, { width: '60%' }]} />
            </View>
            <View style={styles.growthStats}>
              <View style={styles.growthStat}>
                <Text style={styles.growthStatValue}>+1.2cm</Text>
                <Text style={styles.growthStatLabel}>This Week</Text>
              </View>
              <View style={styles.growthStat}>
                <Text style={styles.growthStatValue}>+4.8cm</Text>
                <Text style={styles.growthStatLabel}>This Month</Text>
              </View>
            </View>
          </View>
          
          <TouchableOpacity style={styles.updateButton}>
            <Icon name="refresh-cw" size={18} color="#2e7d32" />
            <Text style={styles.updateButtonText}>Update Measurements</Text>
          </TouchableOpacity>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Icon name="settings" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.actionText}>Hair Care Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Icon name="calendar" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.actionText}>Treatment Schedule</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <View style={styles.actionIcon}>
              <Icon name="help-circle" size={20} color="#2e7d32" />
            </View>
            <Text style={styles.actionText}>Hair Care Tips</Text>
          </TouchableOpacity>
        </View>

        {/* Image Upload Modal */}
        <Modal
          transparent={true}
          visible={modalVisible}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={25} />
            <View style={styles.modalSheet}>
              {user.imagePath && (
                <Pressable style={styles.modalButton} onPress={handleRemovePhoto}>
                  <Text style={[styles.modalButtonText, styles.destructiveText]}>
                    Remove Current Photo
                  </Text>
                </Pressable>
              )}
              <Pressable style={styles.modalButton} onPress={handleImageUpload}>
                <Text style={styles.modalButtonText}>Upload New Photo</Text>
              </Pressable>
              <Pressable style={[styles.modalButton, styles.cancelButton]} onPress={() => setModalVisible(false)}>
                <Text style={[styles.modalButtonText, { color: "#007AFF" }]}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
    paddingHorizontal: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    marginBottom: 10,
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2e7d32",
  },
  // Profile Section
  profileSection: {
    alignItems: "center",
    marginBottom: 25,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#2e7d32",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#2e7d32",
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
  },
  userName: {
    fontSize: 24,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: "#666",
  },
  // Record Button
  recordButton: {
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginBottom: 25,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  recordButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
  },
  // Stats Container
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginHorizontal: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  statIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#f0f7f0",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#000",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  // Section Title
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#000",
    marginBottom: 15,
  },
  // Details Card
  detailsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 16,
    color: "#666",
  },
  detailValue: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  // Concerns
  concernsContainer: {
    paddingVertical: 12,
  },
  concernsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  concernTag: {
    backgroundColor: "#f0f7f0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  concernText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "500",
  },
  // Products Card
  productsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  productItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  productIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 2,
  },
  productBrand: {
    fontSize: 14,
    color: "#666",
  },
  // Growth Update Card
  growthUpdateCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  growthProgressContainer: {
    marginBottom: 20,
  },
  growthProgressBar: {
    height: 8,
    backgroundColor: "#e0e0e0",
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 15,
  },
  growthProgressFill: {
    height: "100%",
    backgroundColor: "#2e7d32",
    borderRadius: 4,
  },
  growthStats: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  growthStat: {
    alignItems: "center",
  },
  growthStatValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 4,
  },
  growthStatLabel: {
    fontSize: 14,
    color: "#666",
  },
  updateButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f0f7f0",
    paddingVertical: 12,
    borderRadius: 10,
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2e7d32",
    marginLeft: 10,
  },
  // Actions Card
  actionsCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    marginBottom: 30,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f0f7f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  actionText: {
    fontSize: 16,
    color: "#333",
    flex: 1,
  },
  // Modal Styles
  modalBackground: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
  modalSheet: {
    width: "100%",
    backgroundColor: "#dcfdd3ff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  modalButton: {
    width: "80%",
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    marginVertical: 6,
    backgroundColor: "#2e7d32",
  },
  modalButtonText: {
    fontSize: 18,
    fontWeight: "500",
    color: "#ffffffff",
  },
  destructiveText: {
    color: "#f9f6f5ff",
  },
  cancelButton: {
    backgroundColor: "#E5E5EA",
    marginTop: 8,
  },
});

export default ProfileScreen;