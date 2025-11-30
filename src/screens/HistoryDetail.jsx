import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  Dimensions,
  SafeAreaView,
  TouchableOpacity,
  Animated,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Ionicons from "react-native-vector-icons/Ionicons";

const { width, height } = Dimensions.get("window");

const HistoryDetail = () => {
  const route = useRoute();
  const navigation = useNavigation();
  
  // Safe access to route params with default values
  const historyItem = route.params?.historyItem || {
    id: 1,
    date: "2024-01-15",
    analysisNo: "HA-001",
    image: "../assets/female.png",
    condition: "Healthy",
    confidence: "92%",
  };
  
  const [displayData, setDisplayData] = useState({});
  const [isTyping, setIsTyping] = useState(true);
  const [currentCard, setCurrentCard] = useState("header");
  const [visibleCards, setVisibleCards] = useState(["header"]);
  const [cardHeights, setCardHeights] = useState({});
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const cardPositions = useRef({});

  // Sample AI-generated results data
  const aiResults = {
    disease: "Androgenetic Alopecia",
    confidence: 92.5,
    sections: {
      "Diagnosis": {
        text: "Pattern hair loss consistent with androgenetic alopecia",
        items: [
          "Hamilton-Norwood Scale: Stage III",
          "Miniaturization of hair follicles observed",
          "Progressive hair thinning in crown area"
        ]
      },
      "Root Cause Analysis": {
        text: "Primary contributing factors identified",
        items: [
          "Genetic predisposition to DHT sensitivity",
          "Hormonal imbalance detected",
          "Moderate scalp inflammation present"
        ]
      },
      "Treatment Recommendations": [
        {
          text: "Medical Interventions",
          items: [
            "Topical Minoxidil 5% solution twice daily",
            "Finasteride 1mg daily (consult dermatologist)",
            "Low-level laser therapy 3 times weekly"
          ]
        },
        {
          text: "Lifestyle Changes",
          items: [
            "Balanced diet rich in protein and iron",
            "Reduce stress through meditation/yoga",
            "Improve sleep quality (7-8 hours nightly)"
          ]
        }
      ],
      "Expected Timeline": {
        text: "Treatment progress expectations",
        items: [
          "Month 1-3: Reduced hair shedding",
          "Month 4-6: Visible regrowth in affected areas",
          "Month 7-12: Significant improvement in density"
        ]
      }
    }
  };

  // Function to scroll to a specific card
  const scrollToCard = (cardKey) => {
    if (scrollViewRef.current && cardPositions.current[cardKey]) {
      const yOffset = cardPositions.current[cardKey];
      scrollViewRef.current.scrollTo({
        y: yOffset - 100, // Offset to show some context above
        animated: true
      });
    }
  };

  // Function to calculate card positions
  const calculateCardPositions = () => {
    let currentY = 0;
    const positions = {};
    
    // Image section height (approximate)
    positions.image = currentY;
    currentY += 320; // image section approximate height
    
    // Results title
    positions.resultsTitle = currentY;
    currentY += 50;
    
    // Header card
    positions.header = currentY;
    currentY += cardHeights.header || 150;
    
    // Section cards
    Object.keys(aiResults.sections).forEach(sectionKey => {
      positions[sectionKey] = currentY;
      currentY += cardHeights[sectionKey] || 200;
    });
    
    cardPositions.current = positions;
  };

  // Function to simulate typing effect
  const typeText = (text, cardKey, onComplete) => {
    return new Promise((resolve) => {
      let index = 0;
      const typingSpeed = 30;
      
      const typingInterval = setInterval(() => {
        if (index <= text.length) {
          setDisplayData(prev => ({
            ...prev,
            [cardKey]: text.substring(0, index)
          }));
          index++;
        } else {
          clearInterval(typingInterval);
          if (onComplete) onComplete();
          resolve();
        }
      }, typingSpeed);
    });
  };

  // Function to format section content as text
  const formatSectionContent = (content) => {
    if (Array.isArray(content)) {
      let formattedText = "";
      content.forEach((item, index) => {
        if (item.text && item.items) {
          formattedText += `• ${item.text}\n`;
          item.items.forEach((subItem) => {
            formattedText += `   ◦ ${subItem}\n`;
          });
        } else if (item.text) {
          formattedText += `• ${item.text}\n`;
        }
      });
      return formattedText.trim();
    } else if (content.text && !content.items) {
      return content.text;
    } else if (content.text && Array.isArray(content.items)) {
      let formattedText = `${content.text}\n`;
      content.items.forEach((subItem) => {
        formattedText += `• ${subItem}\n`;
      });
      return formattedText.trim();
    }
    return "Analyzing data...";
  };

  // Initialize typing animation
  const startSequentialTyping = async () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Initialize header with dot
    setDisplayData({
      header: "●"
    });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Type header card first
    setCurrentCard("header");
    const headerText = `Analysis Report\n${aiResults.disease}\nConfidence: ${aiResults.confidence.toFixed(2)}%`;
    await typeText(headerText, "header");
    await new Promise(resolve => setTimeout(resolve, 400));

    // Type each section card sequentially
    const sectionKeys = Object.keys(aiResults.sections);
    for (let i = 0; i < sectionKeys.length; i++) {
      const sectionKey = sectionKeys[i];
      
      setVisibleCards(prev => [...prev, sectionKey]);
      setCurrentCard(sectionKey);
      
      setDisplayData(prev => ({
        ...prev,
        [sectionKey]: "●"
      }));

      await new Promise(resolve => setTimeout(resolve, 200));

      // Recalculate positions and scroll to current card
      setTimeout(() => {
        calculateCardPositions();
        scrollToCard(sectionKey);
      }, 100);

      const sectionContent = formatSectionContent(aiResults.sections[sectionKey]);
      await typeText(sectionContent, sectionKey);
      
      if (i < sectionKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    setIsTyping(false);
  };

  useEffect(() => {
    startSequentialTyping();
  }, []);

  // Update card positions when heights change
  useEffect(() => {
    calculateCardPositions();
  }, [cardHeights]);

  // Function to measure card height
  const onCardLayout = (cardKey, event) => {
    const { height } = event.nativeEvent.layout;
    setCardHeights(prev => ({
      ...prev,
      [cardKey]: height
    }));
  };

  // Render header card content
  const renderHeaderContent = () => {
    const content = displayData["header"] || "●";
    
    if (content === "●") {
      return (
        <Text style={[styles.diseaseName, styles.typingText]}>
          {content}
          {isTyping && currentCard === "header" && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>
      );
    }

    const lines = content.split('\n');
    return (
      <View>
        <Text style={styles.headerTitle}>
          {lines[0] || "Analysis Report"}
          {isTyping && currentCard === "header" && lines.length <= 1 && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>
        
        <Text style={styles.diseaseName}>
          {lines[1] || aiResults.disease}
          {isTyping && currentCard === "header" && lines.length <= 2 && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {lines[2] || `Confidence: ${aiResults.confidence.toFixed(2)}%`}
            {isTyping && currentCard === "header" && lines.length <= 3 && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${aiResults.confidence}%`,
                  opacity: isTyping && currentCard === "header" ? 0.7 : 1
                },
              ]}
            />
          </View>
        </View>
      </View>
    );
  };

  // Render section card content
  const renderSectionContent = (sectionKey) => {
    const content = displayData[sectionKey] || "●";
    
    if (content === "●") {
      return (
        <Text style={[styles.sectionText, styles.typingText]}>
          {content}
          {isTyping && currentCard === sectionKey && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>
      );
    }

    const lines = content.split('\n');
    return lines.map((line, index) => {
      if (line.startsWith('   ◦ ')) {
        return (
          <Text key={index} style={styles.listItem}>
            {line}
            {isTyping && currentCard === sectionKey && index === lines.length - 1 && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
        );
      } else if (line.startsWith('• ')) {
        return (
          <Text key={index} style={styles.sectionText}>
            {line}
            {isTyping && currentCard === sectionKey && index === lines.length - 1 && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
        );
      } else {
        return (
          <Text key={index} style={styles.sectionText}>
            {line}
            {isTyping && currentCard === sectionKey && index === lines.length - 1 && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
        );
      }
    });
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
          <Text style={styles.headerText}>Analysis Details</Text>
          <TouchableOpacity style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        <ScrollView
          ref={scrollViewRef}
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
                <Text style={styles.imageText}>{historyItem.analysisNo}</Text>
                <Text style={styles.imageDate}>
                  {new Date(historyItem.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </View>
          </View>

          {/* AI Generated Results */}
          <View style={styles.resultsSection}>
            <Text style={styles.sectionTitle}>AI Analysis Results</Text>
            
            {/* Header Card */}
            {visibleCards.includes("header") && (
              <Animated.View 
                style={[styles.headerCard, { opacity: fadeAnim }]}
                onLayout={(event) => onCardLayout("header", event)}
              >
                {renderHeaderContent()}
              </Animated.View>
            )}

            {/* Section Cards */}
            {Object.keys(aiResults.sections).map((sectionKey) => (
              visibleCards.includes(sectionKey) && (
                <Animated.View 
                  key={sectionKey} 
                  style={[styles.sectionCard, { opacity: fadeAnim }]}
                  onLayout={(event) => onCardLayout(sectionKey, event)}
                >
                  <Text style={styles.sectionTitle}>
                    {sectionKey}
                    {isTyping && currentCard === sectionKey && (
                      <Text style={styles.cursor}>|</Text>
                    )}
                  </Text>
                  {renderSectionContent(sectionKey)}
                </Animated.View>
              )
            ))}
          </View>

          {/* Action Buttons */}
          {!isTyping && (
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
          )}

          {/* Footer */}
          {!isTyping && (
            <Text style={styles.footerText}>
              AI-powered Hair Analysis • {historyItem.date}
            </Text>
          )}
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

// ... (styles remain exactly the same as in your original code)

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
  headerText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
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
    fontSize: 13,
    color: "#636e72",
    lineHeight: 18,
    marginLeft: 10,
  },
  
  // Typing effects
  typingText: {
    fontStyle: "italic",
    color: "#81c784",
  },
  cursor: {
    color: "#00b894",
    fontWeight: "bold",
    opacity: 0.7,
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
  
  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 12,
    color: "#95a5a6",
    marginTop: 20,
  },
});

export default HistoryDetail;