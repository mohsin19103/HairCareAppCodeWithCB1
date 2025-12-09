import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { BASE_URL } from "../config/Api";

const { width, height } = Dimensions.get("window");

const USER_HISTORY_URL = `${BASE_URL}/api/ai-responses/user`;

const UserHistory = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [error, setError] = useState(null);

  // Get JWT token from AsyncStorage
  const getAuthToken = async () => {
    try {
      const tokenKeys = ['userToken', 'token', 'jwtToken', 'authToken'];
      for (const key of tokenKeys) {
        const token = await AsyncStorage.getItem(key);
        if (token) {
          return token;
        }
      }
      return null;
    } catch (error) {
      console.error("Error getting auth token:", error);
      return null;
    }
  };

  // Fetch user analysis history
  const fetchUserHistory = async () => {
    try {
      setError(null);
      const token = await getAuthToken();
      
      if (!token) {
        setError("Please login to view your analysis history");
        setLoading(false);
        setRefreshing(false);
        return;
      }

      const response = await axios.get(USER_HISTORY_URL, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 15000
      });

      if (response.data && Array.isArray(response.data)) {
        if (response.data.length === 0) {
          setHistoryData([]);
        } else {
          const transformedData = response.data.map((item, index) => ({
            id: item.id,
            date: item.created_at || item.createdAt || new Date().toISOString(),
            analysisNo: `HA-${item.id.toString().padStart(3, '0')}`,
            image: getImageUrl(item),
            condition: item.disease || item.predicted_label || "Unknown Condition",
            confidence: item.confidence ? `${Math.round(item.confidence)}%` : "N/A",
            confidenceValue: item.confidence || 0,
            sections: item.sections || {},
            originalData: item
          }));
          
          transformedData.sort((a, b) => new Date(b.date) - new Date(a.date));
          setHistoryData(transformedData);
        }
      } else {
        setHistoryData([]);
      }
    } catch (error) {
      console.error("Error fetching user history:", error);
      if (error.response?.status === 401 || error.response?.status === 403) {
        setError("Session expired. Please login again.");
      } else if (error.response?.status === 404) {
        setError("No analysis history found");
      } else {
        setError("Unable to load analysis history");
      }
      setHistoryData([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Helper function to get appropriate image URL
  const getImageUrl = (item) => {
    if (item.image && item.image.startsWith('http')) return item.image;
    if (item.userImage && item.userImage.startsWith('http')) return item.userImage;
    if (item.captureImage && item.captureImage.startsWith('http')) return item.captureImage;
    if (item.photo && item.photo.startsWith('http')) return item.photo;
    
    const condition = item.disease || item.predicted_label || "hair";
    const conditionLower = condition.toLowerCase();
    
    if (conditionLower.includes("healthy")) {
      return "https://via.placeholder.com/100/2e7d32/ffffff?text=Healthy";
    } else if (conditionLower.includes("thinning")) {
      return "https://via.placeholder.com/100/f57c00/ffffff?text=Thinning";
    } else if (conditionLower.includes("alopecia")) {
      return "https://via.placeholder.com/100/c2185b/ffffff?text=Alopecia";
    } else {
      return "https://via.placeholder.com/100/2e7d32/ffffff?text=Hair";
    }
  };

  useEffect(() => {
    fetchUserHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchUserHistory();
  };

  const handleCardPress = (item) => {
    navigation.navigate("HistoryDetail", { 
      historyItem: item,
      analysisData: item.originalData 
    });
  };

  const getConditionColor = (condition) => {
    if (!condition) return "#2e7d32";
    const conditionLC = condition.toLowerCase();
    if (conditionLC.includes("healthy")) return "#2e7d32";
    if (conditionLC.includes("thinning") || conditionLC.includes("mild")) return "#f57c00";
    if (conditionLC.includes("dry") || conditionLC.includes("scalp")) return "#ffb300";
    if (conditionLC.includes("dandruff") || conditionLC.includes("psoriasis")) return "#d84315";
    if (conditionLC.includes("alopecia")) return "#c2185b";
    return "#2e7d32";
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return "Unknown date";
    }
  };

  const calculateStats = () => {
    if (historyData.length === 0) return { totalScans: 0, healthyCount: 0, bestScore: 0 };
    const healthyCount = historyData.filter(item => 
      item.condition?.toLowerCase().includes("healthy")
    ).length;
    const bestScore = Math.max(...historyData.map(item => item.confidenceValue || 0));
    return {
      totalScans: historyData.length,
      healthyCount,
      bestScore: Math.round(bestScore)
    };
  };

  const stats = calculateStats();

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <LinearGradient colors={["#e8f5e9", "#ffffff"]} style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>Loading analysis history...</Text>
          </View>
        </LinearGradient>
      </SafeAreaView>
    );
  }

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
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerText} numberOfLines={1} adjustsFontSizeToFit>
              Analysis History
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={refreshing}
          >
            <Ionicons 
              name={refreshing ? "refresh" : "refresh-outline"} 
              size={22} 
              color="#2e7d32" 
            />
          </TouchableOpacity>
        </View>

        {/* Stats Overview - Only show when there are records */}
        {historyData.length > 0 && (
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.totalScans}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.healthyCount}</Text>
              <Text style={styles.statLabel}>Healthy</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{stats.bestScore}</Text>
              <Text style={styles.statLabel}>Best Score</Text>
            </View>
          </View>
        )}

        {/* Error Message - Only show error when there are no records */}
        {error && historyData.length === 0 && !loading && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={40} color="#d32f2f" />
            <Text style={styles.errorTitle}>Unable to Load</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* History List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            historyData.length === 0 && { flexGrow: 1 }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#2e7d32"]}
              tintColor="#2e7d32"
            />
          }
        >
          {historyData.length === 0 && !loading ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIllustration}>
                <Ionicons name="document-text-outline" size={80} color="#c8e6c9" />
              </View>
              <Text style={styles.emptyTitle}>No Analysis Found</Text>
              <Text style={styles.emptyText}>
                {error ? "Could not load your analysis history" : "Start your hair health journey with your first scan"}
              </Text>
              <TouchableOpacity 
                style={styles.scanButton}
                onPress={() => navigation.navigate("Scanner")}
              >
                <Ionicons name="camera-outline" size={20} color="#fff" />
                <Text style={styles.scanButtonText}>Start First Scan</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {historyData.length > 0 && (
                <Text style={styles.resultsCount}>
                  {historyData.length} analysis{historyData.length !== 1 ? 'es' : ''}
                </Text>
              )}
              {historyData.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.historyCard}
                  onPress={() => handleCardPress(item)}
                  activeOpacity={0.9}
                >
                  {/* Circular Image */}
                  <View style={styles.imageContainer}>
                    <Image
                      source={{ uri: item.image }}
                      style={styles.circularImage}
                      defaultSource={require('../assets/female.png')}
                    />
                    <View 
                      style={[
                        styles.conditionBadge,
                        { backgroundColor: getConditionColor(item.condition) }
                      ]}
                    >
                      <Text style={styles.conditionText}>
                        {item.condition.length > 12 
                          ? item.condition.substring(0, 12) + "..." 
                          : item.condition}
                      </Text>
                    </View>
                  </View>

                  {/* Details */}
                  <View style={styles.detailsContainer}>
                    <View style={styles.detailsHeader}>
                      <Text style={styles.analysisNo}>{item.analysisNo}</Text>
                      <Text style={styles.confidenceValue}>{item.confidence}</Text>
                    </View>
                    <Text style={styles.date}>
                      <Ionicons name="calendar-outline" size={12} color="#757575" />
                      {" "}{formatDate(item.date)}
                    </Text>
                    {item.originalData?.user_id && (
                      <View style={styles.userIdContainer}>
                        <Ionicons name="person-outline" size={10} color="#9e9e9e" />
                        <Text style={styles.userId}>ID: {item.originalData.user_id}</Text>
                      </View>
                    )}
                  </View>

                  {/* Arrow */}
                  <View style={styles.arrowContainer}>
                    <Ionicons name="chevron-forward" size={18} color="#2e7d32" />
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate("Scanner")}
          >
            <Ionicons name="home-outline" size={22} color="#4f4f4f" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Chatbot")}
          >
            <Ionicons name="chatbubbles-outline" size={22} color="#4f4f4f" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="leaf-outline" size={22} color="#4f4f4f" />
            <Text style={styles.navText}>Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItemActive}>
            <Ionicons name="person-outline" size={22} color="#2e7d32" />
            <Text style={styles.navTextActive}>History</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate("ProductScreen")}
          >
            <Ionicons name="flask-outline" size={22} color="#4f4f4f" />
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e0f2f1",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  headerTitleContainer: {
    flex: 1,
    marginHorizontal: 12,
  },
  headerText: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2e7d32",
    textAlign: "center",
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  statsContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 20,
    margin: 16,
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 4,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#616161",
    fontWeight: "500",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 90,
  },
  resultsCount: {
    fontSize: 14,
    color: "#616161",
    fontWeight: "500",
    marginTop: 8,
    marginBottom: 12,
  },
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  imageContainer: {
    position: "relative",
    marginRight: 12,
  },
  circularImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: "#e8f5e9",
  },
  conditionBadge: {
    position: "absolute",
    bottom: -4,
    right: -4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    minWidth: 40,
  },
  conditionText: {
    color: "#ffffff",
    fontSize: 9,
    fontWeight: "700",
    textAlign: "center",
  },
  detailsContainer: {
    flex: 1,
  },
  detailsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  analysisNo: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2e7d32",
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#f57c00",
  },
  date: {
    fontSize: 11,
    color: "#757575",
    marginBottom: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  userIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  userId: {
    fontSize: 10,
    color: "#9e9e9e",
    marginLeft: 4,
  },
  arrowContainer: {
    padding: 6,
    marginLeft: 4,
  },
  navigationBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 8,
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    minWidth: 50,
  },
  navItemActive: {
    alignItems: "center",
    minWidth: 50,
  },
  navText: {
    color: "#757575",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "500",
  },
  navTextActive: {
    color: "#2e7d32",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "500",
  },
  errorContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#d32f2f",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyIllustration: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#f1f8e9",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#2e7d32",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: "#616161",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 32,
  },
  scanButton: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  scanButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
});

export default UserHistory;