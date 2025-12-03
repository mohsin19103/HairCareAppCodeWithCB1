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

const API_BASE_URL = BASE_URL ;

const ProfileScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);

  // Sample user data for demonstration
  const sampleUser = {
    first_name: "John",
    last_name: "Doe",
    email: "john.doe@example.com",
    gender: "Male",
    age: 32,
    country: "United States",
    role: "Premium User",
    status: "Active",
    imagePath: null
  };

  useEffect(() => {
    const loadUser = async () => {
      try {
        // Try to load user from AsyncStorage
        const savedUser = await AsyncStorage.getItem("user");
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          // Use sample data if no user found (for demo)
          setUser(sampleUser);
          await AsyncStorage.setItem("user", JSON.stringify(sampleUser));
        }
      } catch (error) {
        console.log("Error loading user:", error);
        // Fallback to sample data
        setUser(sampleUser);
      } finally {
        setLoading(false);
      }
    };
    loadUser();
  }, []);

  const handleImageUpload = async () => {
    // Launch image library to select a photo
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
          
          // Get the token for authentication
          const token = await AsyncStorage.getItem("token");
          
          // Create form data for the image upload
          const formData = new FormData();
          formData.append('imageFile', {
            uri: asset.uri,
            type: asset.type || 'image/jpeg',
            name: asset.fileName || `profile_${Date.now()}.jpg`,
          });

          // Make the API call to upload the image
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
            // Update user with new image path
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
          
          // For demo purposes, if API fails, use the local image URI
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

  // Function to get the image source based on the imagePath
  const getImageSource = () => {
    if (!user || !user.imagePath) {
      return require("../assets/female.png");
    }
    
    // Check if imagePath is a local URI (starts with file://)
    if (user.imagePath.startsWith('file://')) {
      return { uri: user.imagePath };
    }
    
    // Check if imagePath is a URL (starts with http:// or https://)
    if (user.imagePath.startsWith('http://') || user.imagePath.startsWith('https://')) {
      return { uri: user.imagePath };
    }
    
    // If it's a server path, construct the full URL
    if (user.imagePath.includes('D:/images/')) {
      // Extract just the filename from the path
      const filename = user.imagePath.replace('D:/images/', '');
      return { uri: `${API_BASE_URL}/image/getImage?imagePath=images/${filename}` };
    }
    
    // Default case
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
      <ScrollView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>My Profile</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Icon name="x" size={26} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Profile Image Section with Camera Icon */}
        <View style={styles.imageWrapper}>
          <View style={styles.imageContainer}>
            <Image
              source={getImageSource()}
              style={styles.profileImage}
              onError={(e) => {
                console.log("Error loading image:", e.nativeEvent.error);
                // Fallback to default image if there's an error
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
              <FontAwesome5 name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Modern Apple-style Modal */}
        {/* Modern Apple-style Modal */}
<Modal
  transparent={true}
  visible={modalVisible}
  animationType="slide"
  onRequestClose={() => setModalVisible(false)}
>
  <View style={styles.modalBackground}>
    {/* Blurred background */}
    <BlurView style={StyleSheet.absoluteFill} blurType="light" blurAmount={25} />

    {/* Modal sheet */}
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


        {/* User Details */}
        <View style={styles.detailsCard}>
          <Text style={styles.label}>First Name</Text>
          <Text style={styles.value}>{user.first_name}</Text>

          <Text style={styles.label}>Last Name</Text>
          <Text style={styles.value}>{user.last_name}</Text>

          <Text style={styles.label}>Email</Text>
          <Text style={styles.value}>{user.email}</Text>

          <Text style={styles.label}>Gender</Text>
          <Text style={styles.value}>{user.gender}</Text>

          <Text style={styles.label}>Age</Text>
          <Text style={styles.value}>{user.age}</Text>

          <Text style={styles.label}>Country</Text>
          <Text style={styles.value}>{user.country}</Text>

          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{user.role}</Text>

          <Text style={styles.label}>Status</Text>
          <Text style={[styles.value, styles.statusActive]}>{user.status}</Text>
        </View>
        
        {/* Additional Actions */}
        <View style={styles.actionsCard}>
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="edit" size={20} color="#2e7d32" />
            <Text style={styles.actionText}>Edit Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="shield" size={20} color="#2e7d32" />
            <Text style={styles.actionText}>Privacy Settings</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton}>
            <Icon name="bell" size={20} color="#2e7d32" />
            <Text style={styles.actionText}>Notification Preferences</Text>
          </TouchableOpacity>
        </View>

        <Toast />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#f5f5f7",
  },
  container: {
    flex: 1,
    backgroundColor: "#f5f5f7",
    padding: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    alignItems: "center",
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  imageWrapper: {
    alignItems: "center",
    marginBottom: 20,
  },
  imageContainer: {
    position: "relative",
    marginBottom: 15,
  },
  profileImage: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 3,
    borderColor: "#2e7d32",
  },
  cameraIcon: {
    position: "absolute",
    bottom: 5,
    right: 5,
    backgroundColor: "#2e7d32",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  uploadOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.4)",
    borderRadius: 70,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1,
  },
  // Modal Styles
// Modal Styles (Apple-style)
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
  shadowColor: "#000",
  shadowOffset: { width: 0, height: -3 },
  shadowOpacity: 0.1,
  shadowRadius: 10,
  elevation: 10,
},
modalButton: {
  width: "80%",
  paddingVertical: 16,
  alignItems: "center",
  justifyContent: "center",
  borderRadius: 14,
  marginVertical: 6,
  backgroundColor: "#2e7d32",
  shadowColor: "#000",
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.08,
  shadowRadius: 4,
  elevation: 3,
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
  color:"#2e7d32"
},

  detailsCard: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: "#777",
    marginTop: 12,
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    fontWeight: "600",
    color: "#000",
    marginBottom: 4,
  },
  statusActive: {
    color: "#2e7d32",
  },
  actionsCard: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 30,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  actionText: {
    marginLeft: 15,
    fontSize: 16,
    color: "#333",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ProfileScreen;