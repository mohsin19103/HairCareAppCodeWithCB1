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

  // Get JWT token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const token = await AsyncStorage.getItem('userToken') || 
                    await AsyncStorage.getItem('token') || 
                    await AsyncStorage.getItem('jwtToken');
      return token;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
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
        return;
      }

      const DELETE_URL = `${BASE_URL}/api/ai-responses/${analysisData.id}`;
      console.log("Deleting analysis:", DELETE_URL);

      const response = await axios.delete(DELETE_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Delete response:", response.status);

      if (response.status === 200 || response.status === 204) {
        // Show success message
        Alert.alert(
          "Success",
          "Analysis deleted successfully!",
          [
            {
              text: "OK",
              onPress: () => {
                // Navigate back to history screen
                navigation.goBack();
                // You might want to pass a callback to refresh the list
                if (route.params?.onDelete) {
                  route.params.onDelete(analysisData.id);
                }
              }
            }
          ]
        );
      } else {
        throw new Error("Failed to delete analysis");
      }
    } catch (error) {
      console.error("Error deleting analysis:", error);
      
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
    } finally {
      setIsDeleting(false);
    }
  };

  // Show delete confirmation modal
  const confirmDelete = () => {
    Alert.alert(
      "Delete Analysis",
      `Are you sure you want to delete this analysis for "${analysisData.disease}"?\n\nThis action cannot be undone.`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: deleteAnalysis
        }
      ]
    );
  };

  // Function to format section content as text
  const formatSectionContent = (content) => {
    if (!content) return "No information available";
    
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
              onPress={confirmDelete}
            >
              <Ionicons name="trash-outline" size={22} color="#d32f2f" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.shareButton}>
              <Ionicons name="share-outline" size={24} color="#2e7d32" />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Analysis Image */}
          <View style={styles.imageSection}>
            <Text style={styles.sectionTitle}>Hair Analysis Image</Text>
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: historyItem.image }}
                style={styles.analysisImage}
                resizeMode="cover"
                defaultSource={require('../assets/female.png')}
              />
              <View style={styles.imageOverlay}>
                <Text style={styles.imageText}>{historyItem.analysisNo || `ID: ${analysisData.id}`}</Text>
                <Text style={styles.imageDate}>
                  {formatDate(analysisData.created_at || historyItem.date)}
                </Text>
              </View>
            </View>
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
  scrollContent: {
    padding: 20,
    paddingBottom: 30,
  },
  
  // Image Section
  imageSection: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 15,
  },
  imageContainer: {
    borderRadius: 20,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
    elevation: 4,
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
});

export default HistoryDetail;