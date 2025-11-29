import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  BackHandler 
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import Icon from "react-native-vector-icons/Feather";

const ResultScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const responseData = route?.params?.responseData;
  const [displayData, setDisplayData] = useState({});
  const [isTyping, setIsTyping] = useState(true);
  const [currentCard, setCurrentCard] = useState("header");
  const [visibleCards, setVisibleCards] = useState(["header"]); // Only show current card
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Handle back button press
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true; // Prevent default back behavior
    });

    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    navigation.navigate('Scanner'); // Navigate to Scanner screen
  };

  if (!responseData || !responseData.result) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ No data available</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Text style={styles.backButtonText}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { result } = responseData;
  const { sections } = result;

  // Function to simulate typing effect
  const typeText = (text, cardKey, onComplete) => {
    return new Promise((resolve) => {
      let index = 0;
      const typingSpeed = 30; // milliseconds per character
      
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

  // Initialize typing animation for all cards sequentially
  const startSequentialTyping = async () => {
    // Start fade animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    // Initialize header with dot
    setDisplayData({
      header: "●"
    });

    // Wait a bit before starting to type
    await new Promise(resolve => setTimeout(resolve, 500));

    // Type header card first
    setCurrentCard("header");
    const headerText = `Diagnosis Report\n${result.disease}\nConfidence: ${result.confidence.toFixed(2)}%`;
    await typeText(headerText, "header");
    await new Promise(resolve => setTimeout(resolve, 400));

    // Type each section card sequentially
    const sectionKeys = Object.keys(sections);
    for (let i = 0; i < sectionKeys.length; i++) {
      const sectionKey = sectionKeys[i];
      
      // Add next card to visible cards
      setVisibleCards(prev => [...prev, sectionKey]);
      setCurrentCard(sectionKey);
      
      // Initialize with dot
      setDisplayData(prev => ({
        ...prev,
        [sectionKey]: "●"
      }));

      await new Promise(resolve => setTimeout(resolve, 200));

      const sectionContent = formatSectionContent(sections[sectionKey]);
      await typeText(sectionContent, sectionKey);
      
      // Pause before next card (except for last card)
      if (i < sectionKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    setIsTyping(false);
  };

  useEffect(() => {
    startSequentialTyping();
  }, [responseData]);

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
          {lines[0] || "Diagnosis Report"}
          {isTyping && currentCard === "header" && lines.length <= 1 && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>
        
        <Text style={styles.diseaseName}>
          {lines[1] || result.disease}
          {isTyping && currentCard === "header" && lines.length <= 2 && (
            <Text style={styles.cursor}>|</Text>
          )}
        </Text>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {lines[2] || `Confidence: ${result.confidence.toFixed(2)}%`}
            {isTyping && currentCard === "header" && lines.length <= 3 && (
              <Text style={styles.cursor}>|</Text>
            )}
          </Text>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                { 
                  width: `${result.confidence}%`,
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
    <LinearGradient
      colors={["#e9fff3", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Back Button Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={handleBackPress}>
          <Icon name="arrow-left" size={24} color="#2e7d32" />
          <Text style={styles.backButtonTextHeader}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card - Always visible once started */}
        {visibleCards.includes("header") && (
          <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
            {renderHeaderContent()}
          </Animated.View>
        )}

        {/* Section Cards - Only show visible ones */}
        {Object.keys(sections).map((sectionKey) => (
          visibleCards.includes(sectionKey) && (
            <Animated.View 
              key={sectionKey} 
              style={[styles.sectionCard, { opacity: fadeAnim }]}
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

        {/* Footer - Only show when all typing is complete */}
        {!isTyping && (
          <Text style={styles.footerText}>
            AI-powered Hair Analysis • v1.0
          </Text>
        )}

        {/* Back Button at Bottom */}
        {!isTyping && (
          <TouchableOpacity style={styles.bottomBackButton} onPress={handleBackPress}>
            <Text style={styles.bottomBackButtonText}>Scan Again</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  errorText: {
    fontSize: 18,
    color: "#e74c3c",
    fontWeight: "600",
    marginBottom: 20,
  },

  // Header with back button
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 10,
  },
  backButtonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  backButtonTextHeader: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Header Card
  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 25,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
  },
  headerTitle: {
    fontSize: 18,
    color: "#2d3436",
    textAlign: "center",
    fontWeight: "700",
    marginBottom: 10,
  },
  diseaseName: {
    fontSize: 26,
    color: "#00b894",
    textAlign: "center",
    fontWeight: "bold",
    marginBottom: 15,
  },
  confidenceContainer: {
    alignItems: "center",
  },
  confidenceText: {
    fontSize: 16,
    color: "#636e72",
    marginBottom: 6,
  },
  progressBar: {
    width: "90%",
    height: 10,
    backgroundColor: "#dfe6e9",
    borderRadius: 10,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#00b894",
    borderRadius: 10,
  },

  // Section Cards
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#00b894",
    marginBottom: 12,
    borderBottomWidth: 2,
    borderBottomColor: "#00b89420",
    paddingBottom: 6,
  },
  sectionText: {
    fontSize: 16,
    color: "#2d3436",
    lineHeight: 24,
    marginBottom: 4,
  },
  listItem: {
    fontSize: 15,
    color: "#636e72",
    lineHeight: 22,
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

  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 20,
    marginBottom: 20,
  },

  // Back Buttons
  backButton: {
    backgroundColor: "#00b894",
    borderRadius: 25,
    paddingVertical: 12,
    paddingHorizontal: 35,
  },
  backButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  bottomBackButton: {
    backgroundColor: "#00b894",
    borderRadius: 25,
    paddingVertical: 15,
    paddingHorizontal: 40,
    alignItems: "center",
    marginTop: 10,
  },
  bottomBackButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ResultScreen;