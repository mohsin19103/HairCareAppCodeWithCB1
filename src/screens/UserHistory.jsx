import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Dimensions,
  SafeAreaView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const UserHistory = () => {
  const navigation = useNavigation();

  // Sample history data
  const historyData = [
    {
      id: 1,
      date: "2024-01-15",
      analysisNo: "HA-001",
      image: "https://via.placeholder.com/100/2e7d32/ffffff?text=Hair+1",
      condition: "Healthy",
      confidence: "92%",
    },
    {
      id: 2,
      date: "2024-01-08",
      analysisNo: "HA-002",
      image: "https://via.placeholder.com/100/388e3c/ffffff?text=Hair+2",
      condition: "Mild Thinning",
      confidence: "85%",
    },
    {
      id: 3,
      date: "2024-01-01",
      analysisNo: "HA-003",
      image: "https://via.placeholder.com/100/43a047/ffffff?text=Hair+3",
      condition: "Dry Scalp",
      confidence: "78%",
    },
    {
      id: 4,
      date: "2023-12-25",
      analysisNo: "HA-004",
      image: "https://via.placeholder.com/100/4caf50/ffffff?text=Hair+4",
      condition: "Healthy",
      confidence: "94%",
    },
    {
      id: 5,
      date: "2023-12-18",
      analysisNo: "HA-005",
      image: "https://via.placeholder.com/100/66bb6a/ffffff?text=Hair+5",
      condition: "Dandruff",
      confidence: "82%",
    },
  ];

  const handleCardPress = (item) => {
    // Navigate to detailed view or show more details
    console.log("Card pressed:", item);
    // You can navigate to a detailed screen here
    // navigation.navigate('HistoryDetail', { historyItem: item });
  };

  const getConditionColor = (condition) => {
    switch (condition) {
      case "Healthy":
        return "#2e7d32";
      case "Mild Thinning":
        return "#f57c00";
      case "Dry Scalp":
        return "#ffb300";
      case "Dandruff":
        return "#d84315";
      default:
        return "#2e7d32";
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
          </TouchableOpacity >
          <Text style={styles.headerText}>Hair History</Text>
          <TouchableOpacity style={styles.filterButton}>
            <Ionicons name="filter-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{historyData.length}</Text>
            <Text style={styles.statLabel}>Total Scans</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {historyData.filter(item => item.condition === "Healthy").length}
            </Text>
            <Text style={styles.statLabel}>Healthy</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>
              {Math.max(...historyData.map(item => parseInt(item.confidence)))}
            </Text>
            <Text style={styles.statLabel}>Best Score</Text>
          </View>
        </View>

        {/* History List */}
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {historyData.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.historyCard}
              onPress={() => navigation.navigate("HistoryDetail")}
              activeOpacity={0.8}
            >
              {/* Circular Image */}
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: item.image }}
                  style={styles.circularImage}
                />
                <View 
                  style={[
                    styles.conditionBadge,
                    { backgroundColor: getConditionColor(item.condition) }
                  ]}
                >
                  <Text style={styles.conditionText}>{item.condition}</Text>
                </View>
              </View>

              {/* Details */}
              <View style={styles.detailsContainer}>
                <Text style={styles.analysisNo}>{item.analysisNo}</Text>
                <Text style={styles.date}>
                  <Ionicons name="calendar-outline" size={14} color="#4f4f4f" />
                  {" "}{new Date(item.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </Text>
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence:</Text>
                  <Text style={styles.confidenceValue}>{item.confidence}</Text>
                </View>
              </View>

              {/* Arrow */}
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={20} color="#2e7d32" />
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate("Scanner")}
          >
            <Ionicons name="home-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Chatbot")}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="leaf-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Weekly Plan</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItemActive}>
            <Ionicons name="person-outline" size={26} color="#2e7d32" />
            <Text style={styles.navTextActive}>Hair History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
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
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    marginTop: 20,
  },
  backButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  filterButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: "#4f4f4f",
    fontWeight: "500",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  historyCard: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 15,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    borderLeftWidth: 4,
    borderLeftColor: "#2e7d32",
  },
  imageContainer: {
    position: "relative",
    marginRight: 15,
  },
  circularImage: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    borderColor: "#e8f5e9",
  },
  conditionBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "#2e7d32",
  },
  conditionText: {
    color: "#ffffff",
    fontSize: 10,
    fontWeight: "bold",
  },
  detailsContainer: {
    flex: 1,
  },
  analysisNo: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 4,
  },
  date: {
    fontSize: 12,
    color: "#4f4f4f",
    marginBottom: 6,
  },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  confidenceLabel: {
    fontSize: 12,
    color: "#4f4f4f",
    marginRight: 4,
  },
  confidenceValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  arrowContainer: {
    padding: 8,
  },
  navigationBar: {
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
  navItemActive: {
    alignItems: "center",
    minWidth: 50,
  },
  navText: {
    color: "#4f4f4f",
    fontSize: 10,
    marginTop: 4,
  },
  navTextActive: {
    color: "#2e7d32",
    fontSize: 10,
    marginTop: 4,
    fontWeight: "600",
  },
});

export default UserHistory;