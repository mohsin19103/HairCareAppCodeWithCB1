//this is result screen 2 where actully the model gernate result 
import React, { useState, useRef, useEffect } from "react";
import { View, Text, ScrollView, StyleSheet, Animated } from "react-native";
import { useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

const ResultScreen = () => {
  const route = useRoute();
  const responseData = route?.params?.responseData;
  const [displayData, setDisplayData] = useState({});
  const [isTyping, setIsTyping] = useState(true);
  const [currentCard, setCurrentCard] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;

  if (!responseData || !responseData.result) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ No data available</Text>
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

    // Initialize all cards with dot
    const initialData = {
      header: "●",
    };
    
    // Initialize section cards with dots
    Object.keys(sections).forEach(key => {
      initialData[key] = "●";
    });
    
    setDisplayData(initialData);

    // Wait a bit before starting to type
    await new Promise(resolve => setTimeout(resolve, 500));

    // Type header card first
    setCurrentCard("header");
    const headerText = `Diagnosis Report\n${result.disease}\nConfidence: ${result.confidence.toFixed(2)}%`;
    await typeText(headerText, "header");
    await new Promise(resolve => setTimeout(resolve, 400));

    // Type each section card sequentially
    for (const sectionKey of Object.keys(sections)) {
      setCurrentCard(sectionKey);
      const sectionContent = formatSectionContent(sections[sectionKey]);
      await typeText(sectionContent, sectionKey);
      await new Promise(resolve => setTimeout(resolve, 400)); // Pause between cards
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
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
          {renderHeaderContent()}
        </Animated.View>

        {/* Section Cards */}
        {Object.keys(sections).map((sectionKey) => (
          <Animated.View 
            key={sectionKey} 
            style={[
              styles.sectionCard, 
              { 
                opacity: fadeAnim,
                // Slightly dim cards that haven't been typed yet
                opacity: !displayData[sectionKey] || displayData[sectionKey] === "●" ? 0.7 : 1
              }
            ]}
          >
            <Text style={styles.sectionTitle}>
              {sectionKey}
              {isTyping && currentCard === sectionKey && (
                <Text style={styles.cursor}>|</Text>
              )}
            </Text>
            {renderSectionContent(sectionKey)}
          </Animated.View>
        ))}

        <Text style={styles.footerText}>
          AI-powered Hair Analysis • v1.0
          {isTyping && <Text style={styles.cursor}>|</Text>}
        </Text>
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
  },

  // Header
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
  },
});

export default ResultScreen;