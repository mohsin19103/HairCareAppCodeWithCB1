import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Modal,
  Animated,
  Easing,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/Api";

const { width, height } = Dimensions.get("window");

const HistoryDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Get the full analysis data from route params
  const analysisData = route.params?.analysisData || {
    id: 24,
    disease: "Hair Thinning",
    confidence: 98.29980134963989,
    sections: {
      "Definition": { "text": "Hair thinning refers to minor to moderate hair loss that gives the appearance of reduced hair density without complete baldness." },
      "Causes": [{ "text": "Genetics (Androgenetic Alopecia)" }],
      "Solutions": [{ "text": "Treat nutritional deficiencies" }],
      "Recommendations": [{ "text": "Eat a balanced diet rich in iron, biotin, omega-3, zinc" }],
      "Preventive Tips": [{ "text": "Avoid brushing wet hair" }]
    },
    user_id: 4089,
    created_at: "2025-12-08T22:42:49.8094"
  };
  
  const historyItem = route.params?.historyItem || {
    id: 24,
    analysisNo: "HA-024",
    image: "https://via.placeholder.com/100/2e7d32/ffffff?text=Hair+1",
    condition: analysisData.disease || "Unknown",
    confidence: analysisData.confidence ? `${Math.round(analysisData.confidence)}%` : "N/A",
  };
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [hairImages, setHairImages] = useState([]);
  const [loadingImages, setLoadingImages] = useState(true);
  
  // Animation values for modal
  const modalScale = useState(new Animated.Value(0.7))[0];
  const modalOpacity = useState(new Animated.Value(0))[0];

  // Build image URL from image path
  const buildImageUrl = (imagePath) => {
    if (!imagePath) {
      console.log("⚠️ No image path provided");
      return null;
    }
    
    // If it's already a full URL, return it
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    // Build URL using the getImage endpoint
    const imageUrl = `${BASE_URL}/image/getImage?imagePath=${encodeURIComponent(imagePath)}`;
    console.log(`🖼️ Built image URL: ${imageUrl}`);
    return imageUrl;
  };

  // Get JWT token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const tokenKeys = ['userToken', 'token', 'jwtToken', 'authToken'];
      for (const key of tokenKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token) {
          console.log(`✅ Token found with key: ${key}`);
          return token;
        }
      }
      console.log("❌ No token found in AsyncStorage");
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  // Fetch hair images for this analysis
  const fetchHairImages = async () => {
    try {
      setLoadingImages(true);
      const token = await getAuthToken();
      
      if (!token) {
        console.log("⚠️ No token available, using placeholder image");
        setLoadingImages(false);
        return;
      }

      console.log(`📡 Fetching images for analysis ID: ${analysisData.id}`);

      // Fetch the specific analysis details to get image paths
      const response = await axios.get(`${BASE_URL}/api/ai-responses/${analysisData.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      });

      console.log("✅ Analysis details response:", response.data);

      if (response.data) {
        const data = response.data;
        const images = [];

        // Check for various possible image path fields
        if (data.imagePath) {
          images.push({
            id: 1,
            path: data.imagePath,
            url: buildImageUrl(data.imagePath)
          });
        } else if (data.image_path) {
          images.push({
            id: 1,
            path: data.image_path,
            url: buildImageUrl(data.image_path)
          });
        }

        // Check for hairImages array
        if (data.hairImages && Array.isArray(data.hairImages)) {
          data.hairImages.forEach((img, index) => {
            const imagePath = img.imagePath || img.image_path;
            if (imagePath) {
              images.push({
                id: img.id || index + 1,
                path: imagePath,
                url: buildImageUrl(imagePath)
              });
            }
          });
        } else if (data.hair_images && Array.isArray(data.hair_images)) {
          data.hair_images.forEach((img, index) => {
            const imagePath = img.imagePath || img.image_path;
            if (imagePath) {
              images.push({
                id: img.id || index + 1,
                path: imagePath,
                url: buildImageUrl(imagePath)
              });
            }
          });
        }

        console.log(`📸 Found ${images.length} images`);
        setHairImages(images);
      }
    } catch (error) {
      console.error("❌ Error fetching hair images:", error);
      if (error.response) {
        console.error("Response error:", error.response.status, error.response.data);
      }
    } finally {
      setLoadingImages(false);
    }
  };

  useEffect(() => {
    fetchHairImages();
  }, [analysisData.id]);

  // Show delete modal with animation
  const showDeleteConfirmation = () => {
    setShowDeleteModal(true);
    Animated.parallel([
      Animated.spring(modalScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Hide delete modal with animation
  const hideDeleteModal = () => {
    Animated.parallel([
      Animated.timing(modalScale, {
        toValue: 0.7,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(modalOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowDeleteModal(false);
    });
  };

  // Delete analysis function
  const deleteAnalysis = async () => {
    try {
      setIsDeleting(true);
      const token = await getAuthToken();
      
      if (!token) {
        Alert.alert(
          "Authentication Required",
          "Please login to delete analysis",
          [{ text: "OK" }]
        );
        setIsDeleting(false);
        hideDeleteModal();
        return;
      }

      const DELETE_URL = `${BASE_URL}/api/ai-responses/${analysisData.id}`;
      console.log("🗑️ Deleting analysis:", DELETE_URL);

      const response = await axios.delete(DELETE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("✅ Delete response:", response.status);

      if (response.status === 200 || response.status === 204) {
        // Show success message
        setTimeout(() => {
          hideDeleteModal();
          setTimeout(() => {
            navigation.goBack();
            if (route.params?.onDelete) {
              route.params.onDelete(analysisData.id);
            }
          }, 300);
        }, 500);
      } else {
        throw new Error("Failed to delete analysis");
      }
    } catch (error) {
      console.error("❌ Error deleting analysis:", error);
      
      let errorMessage = "Failed to delete analysis. Please try again.";
      
      if (error.response) {
        switch (error.response.status) {
          case 401:
          case 403:
            errorMessage = "Session expired. Please login again.";
            break;
          case 404:
            errorMessage = "Analysis not found. It may have already been deleted.";
            break;
          case 500:
            errorMessage = "Server error. Please try again later.";
            break;
        }
      }
      
      Alert.alert("Error", errorMessage, [{ text: "OK" }]);
      hideDeleteModal();
    } finally {
      setIsDeleting(false);
    }
  };

  // Function to format section content as text
  const formatSectionContent = (content) => {
    if (!content) return <Text style={styles.sectionText}>No information available</Text>;
    
    if (Array.isArray(content)) {
      return content.map((item, index) => {
        if (typeof item === 'string') {
          return <Text key={index} style={styles.listItem}>• {item}</Text>;
        } else if (item && typeof item === 'object' && item.text) {
          return <Text key={index} style={styles.listItem}>• {item.text}</Text>;
        }
        return null;
      });
    } else if (content && typeof content === 'object' && content.text) {
      return <Text style={styles.sectionText}>{content.text}</Text>;
    }
    
    return <Text style={styles.sectionText}>Analyzing data...</Text>;
  };

  // Format date for display
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Unknown date";
    }
  };

  // Get the primary image to display
  const getPrimaryImage = () => {
    if (hairImages.length > 0 && hairImages[0].url) {
      return hairImages[0].url;
    }
    return historyItem.image;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#e8f5e9", "#ffffff"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#2e7d32" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerText}>Analysis Details</Text>
            {analysisData.user_id && (
              <Text style={styles.userId}>User ID: {analysisData.user_id}</Text>
            )}
          </View>
          <View style={styles.headerRightButtons}>
            <TouchableOpacity 
              style={styles.deleteButton}
              onPress={showDeleteConfirmation}
              disabled={isDeleting}
            >
              <Ionicons name="trash-outline" size={22} color="#d32f2f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Analysis Image */}
          <View style={styles.imageSection}>
            <View style={styles.imageSectionHeader}>
              <Text style={styles.sectionTitle}>Hair Analysis Images</Text>
              {hairImages.length > 0 && (
                <Text style={styles.imageCount}>
                  {hairImages.length} {hairImages.length === 1 ? 'image' : 'images'}
                </Text>
              )}
            </View>
            
            {loadingImages ? (
              <View style={styles.loadingImageContainer}>
                <ActivityIndicator size="large" color="#2e7d32" />
                <Text style={styles.loadingImageText}>Loading images...</Text>
              </View>
            ) : (
              <>
                {/* Primary Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: getPrimaryImage() }}
                    style={styles.analysisImage}
                    resizeMode="cover"
                    defaultSource={require('../assets/female.png')}
                    onError={(e) => {
                      console.log(`❌ Failed to load primary image:`, e.nativeEvent.error);
                    }}
                    onLoad={() => {
                      console.log(`✅ Successfully loaded primary image`);
                    }}
                  />
                  <View style={styles.imageOverlay}>
                    <Text style={styles.imageText}>{historyItem.analysisNo || `ID: ${analysisData.id}`}</Text>
                    <Text style={styles.imageDate}>
                      {formatDate(analysisData.created_at || historyItem.date)}
                    </Text>
                  </View>
                </View>

                {/* Additional Images Thumbnail Gallery */}
                {hairImages.length > 1 && (
                  <View style={styles.thumbnailGallery}>
                    <Text style={styles.galleryLabel}>All Images:</Text>
                    <ScrollView 
                      horizontal 
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.thumbnailContainer}
                    >
                      {hairImages.map((img, index) => (
                        <View key={img.id || index} style={styles.thumbnailWrapper}>
                          <Image
                            source={{ uri: img.url }}
                            style={styles.thumbnail}
                            resizeMode="cover"
                            onError={(e) => {
                              console.log(`❌ Failed to load thumbnail ${index + 1}:`, e.nativeEvent.error);
                            }}
                          />
                          <Text style={styles.thumbnailLabel}>{String(index + 1)}</Text>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Image Path Info */}
                {hairImages.length > 0 && hairImages[0].path && (
                  <View style={styles.imagePathInfo}>
                    <Ionicons name="image-outline" size={14} color="#757575" />
                    <Text style={styles.imagePathText} numberOfLines={1}>
                      {hairImages[0].path.split('/').pop()}
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* AI Generated Results */}
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>AI Analysis Results</Text>
            
            {/* Header Card */}
            <View style={styles.headerCard}>
              <Text style={styles.headerTitle}>Analysis Report</Text>
              <Text style={styles.diseaseName}>{analysisData.disease || "Unknown Condition"}</Text>
              <View style={styles.confidenceContainer}>
                <Text style={styles.confidenceText}>
                  Confidence: {analysisData.confidence ? analysisData.confidence.toFixed(2) + '%' : 'N/A'}
                </Text>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { 
                        width: `${analysisData.confidence ? Math.min(analysisData.confidence, 100) : 0}%`,
                      },
                    ]}
                  />
                </View>
              </View>
            </View>

            {/* Section Cards */}
            {analysisData.sections && Object.keys(analysisData.sections).map((sectionKey) => (
              <View key={sectionKey} style={styles.sectionCard}>
                <Text style={styles.sectionTitle}>{sectionKey}</Text>
                {formatSectionContent(analysisData.sections[sectionKey])}
              </View>
            ))}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.primaryButton}>
              <Ionicons name="medical-outline" size={20} color="#fff" />
              <Text style={styles.primaryButtonText}>Save Treatment Plan</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.secondaryButton}>
              <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
              <Text style={styles.secondaryButtonText}>Schedule Follow-up</Text>
            </TouchableOpacity>
          </View>

          {/* Delete Warning */}
          <View style={styles.deleteWarning}>
            <Ionicons name="warning-outline" size={16} color="#f57c00" />
            <Text style={styles.deleteWarningText}>
              You can delete this analysis using the trash icon in the header
            </Text>
          </View>

          {/* Footer */}
          <Text style={styles.footerText}>
            AI-powered Hair Analysis • {formatDate(analysisData.created_at || historyItem.date).split(',')[0]}
          </Text>
        </ScrollView>

        {/* Professional Delete Confirmation Modal */}
        <Modal
          visible={showDeleteModal}
          transparent={true}
          animationType="none"
          onRequestClose={hideDeleteModal}
        >
          <Animated.View style={[styles.modalOverlay, { opacity: modalOpacity }]}>
            <Animated.View style={[styles.modalContent, { transform: [{ scale: modalScale }] }]}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <View style={styles.modalIconContainer}>
                  <Ionicons name="warning" size={40} color="#d32f2f" />
                </View>
                <Text style={styles.modalTitle}>Delete Analysis</Text>
                <Text style={styles.modalSubtitle}>
                  Are you sure you want to delete this analysis?
                </Text>
              </View>

              {/* Modal Body */}
              <View style={styles.modalBody}>
                <View style={styles.analysisInfo}>
                  <Text style={styles.infoLabel}>Condition:</Text>
                  <Text style={styles.infoValue}>{analysisData.disease || "Unknown"}</Text>
                </View>
                
                <View style={styles.analysisInfo}>
                  <Text style={styles.infoLabel}>Confidence:</Text>
                  <Text style={styles.infoValue}>
                    {analysisData.confidence ? analysisData.confidence.toFixed(2) + '%' : 'N/A'}
                  </Text>
                </View>
                
                <View style={styles.analysisInfo}>
                  <Text style={styles.infoLabel}>Date:</Text>
                  <Text style={styles.infoValue}>
                    {formatDate(analysisData.created_at).split(',')[0]}
                  </Text>
                </View>
                
                <View style={styles.warningBox}>
                  <Ionicons name="alert-circle-outline" size={18} color="#f57c00" />
                  <Text style={styles.warningText}>
                    This action cannot be undone. All data including images and analysis will be permanently deleted.
                  </Text>
                </View>
              </View>

              {/* Modal Footer */}
              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.cancelButton}
                  onPress={hideDeleteModal}
                  disabled={isDeleting}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.confirmDeleteButton}
                  onPress={deleteAnalysis}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="trash-outline" size={18} color="#fff" />
                      <Text style={styles.confirmDeleteButtonText}>Delete Permanently</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </Animated.View>
          </Animated.View>
        </Modal>

        {/* Loading Overlay for Delete */}
        {isDeleting && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2e7d32" />
              <Text style={styles.loadingText}>Deleting analysis...</Text>
            </View>
          </View>
        )}
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e8f5e9",
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  headerCenter: {
    alignItems: 'center',
    flex: 1,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  userId: {
    fontSize: 12,
    color: '#757575',
    marginTop: 2,
  },
  headerRightButtons: {
    flexDirection: "row",
    alignItems: "center",
  },
  deleteButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#ffebee",
    marginRight: 10,
  },
  shareButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  
  // Image Section
  imageSection: {
    marginBottom: 25,
  },
  imageSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  imageCount: {
    fontSize: 14,
    color: '#757575',
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  loadingImageContainer: {
    height: 250,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 20,
  },
  loadingImageText: {
    marginTop: 10,
    fontSize: 14,
    color: '#757575',
  },
  imageContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
    backgroundColor: '#f5f5f5',
  },
  analysisImage: {
    width: "100%",
    height: 250,
  },
  imageOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "rgba(46, 125, 50, 0.9)",
    padding: 15,
  },
  imageText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 4,
  },
  imageDate: {
    color: "#e8f5e9",
    fontSize: 14,
  },
  thumbnailGallery: {
    marginTop: 15,
  },
  galleryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2e7d32',
    marginBottom: 10,
  },
  thumbnailContainer: {
    paddingVertical: 5,
  },
  thumbnailWrapper: {
    marginRight: 12,
    alignItems: 'center',
  },
  thumbnail: {
    width: 80,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e8f5e9',
  },
  thumbnailLabel: {
    marginTop: 4,
    fontSize: 11,
    color: '#757575',
    fontWeight: '600',
  },
  imagePathInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  imagePathText: {
    fontSize: 12,
    color: '#757575',
    marginLeft: 6,
    flex: 1,
    fontStyle: 'italic',
  },
  
  // Results Section
  resultsSection: {
    marginBottom: 20,
  },
  
  // Header Card
  headerCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 16,
    color: "#2d3436",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  diseaseName: {
    fontSize: 22,
    color: "#00b894",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  confidenceContainer: {
    alignItems: "center",
  },
  confidenceText: {
    fontSize: 14,
    color: "#636e72",
    marginBottom: 6,
  },
  progressBar: {
    width: "90%",
    height: 8,
    backgroundColor: "#dfe6e9",
    borderRadius: 8,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 8,
  },
  
  // Section Cards
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  sectionText: {
    fontSize: 14,
    color: "#2d3436",
    lineHeight: 20,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 14,
    color: "#2d3436",
    lineHeight: 20,
    marginBottom: 6,
  },
  
  // Action Buttons
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 10,
  },
  primaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
  },
  primaryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  secondaryButton: {
    flex: 1,
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderWidth: 2,
    borderColor: "#2e7d32",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  secondaryButtonText: {
    color: "#2e7d32",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  
  // Delete Warning
  deleteWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3e0",
    borderRadius: 12,
    padding: 12,
    marginTop: 15,
    marginBottom: 10,
  },
  deleteWarningText: {
    fontSize: 12,
    color: "#f57c00",
    marginLeft: 8,
    flex: 1,
  },
  
  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 20,
    marginBottom: 20,
  },
  
  // Loading Overlay
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 8,
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "600",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 1001,
  },
  modalContent: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: "#ffffff",
    borderRadius: 24,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  modalHeader: {
    alignItems: "center",
    padding: 30,
    paddingBottom: 20,
    backgroundColor: "#fff9f9",
    borderBottomWidth: 1,
    borderBottomColor: "#ffebee",
  },
  modalIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#ffebee",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#d32f2f",
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 22,
  },
  modalBody: {
    padding: 30,
    paddingTop: 20,
  },
  analysisInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f5f5f5",
  },
  infoLabel: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 15,
    color: "#333",
    fontWeight: "600",
  },
  warningBox: {
    flexDirection: "row",
    backgroundColor: "#fff8e1",
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    alignItems: "flex-start",
  },
  warningText: {
    fontSize: 14,
    color: "#f57c00",
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    paddingTop: 10,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#f5f5f5",
    borderRadius: 14,
    alignItems: "center",
    marginRight: 10,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
  confirmDeleteButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#d32f2f",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 10,
  },
  confirmDeleteButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 8,
  },
});

export default HistoryDetail;