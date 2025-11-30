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
  const [visibleCards, setVisibleCards] = useState(["header"]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // 🚀 Added ScrollView ref
  const scrollViewRef = useRef(null);

  // 🚀 Auto scroll function
  const autoScroll = () => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollToEnd({ animated: true });
      }
    }, 80);
  };

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBackPress();
      return true;
    });

    return () => backHandler.remove();
  }, []);

  const handleBackPress = () => {
    navigation.navigate('Scanner');
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

  // Typing effect
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

          autoScroll(); // 🚀 Auto-scroll added here

          index++;
        } else {
          clearInterval(typingInterval);
          if (onComplete) onComplete();
          resolve();
        }
      }, typingSpeed);
    });
  };

  const formatSectionContent = (content) => {
    if (Array.isArray(content)) {
      let formattedText = "";
      content.forEach((item) => {
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
    }
    return content.text || "Analyzing data...";
  };

  const startSequentialTyping = async () => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();

    setDisplayData({ header: "●" });

    await new Promise(resolve => setTimeout(resolve, 500));

    // Header typing
    const headerText = `Diagnosis Report\n${result.disease}\nConfidence: ${result.confidence.toFixed(2)}%`;
    await typeText(headerText, "header");
    await new Promise(resolve => setTimeout(resolve, 400));

    const sectionKeys = Object.keys(sections);
    for (let i = 0; i < sectionKeys.length; i++) {
      const key = sectionKeys[i];
      setVisibleCards(prev => [...prev, key]);
      setCurrentCard(key);

      setDisplayData(prev => ({ ...prev, [key]: "●" }));
      await new Promise(resolve => setTimeout(resolve, 200));

      const content = formatSectionContent(sections[key]);
      await typeText(content, key);

      if (i < sectionKeys.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 400));
      }
    }

    setIsTyping(false);
  };

  useEffect(() => {
    startSequentialTyping();
  }, [responseData]);

  const renderHeaderContent = () => {
    const content = displayData["header"] || "●";
    const lines = content.split('\n');

    return (
      <View>
        <Text style={styles.headerTitle}>
          {lines[0] || "Diagnosis Report"}
        </Text>

        <Text style={styles.diseaseName}>
          {lines[1] || result.disease}
        </Text>

        <View style={styles.confidenceContainer}>
          <Text style={styles.confidenceText}>
            {lines[2] || `Confidence: ${result.confidence.toFixed(2)}%`}
          </Text>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${result.confidence}%` }]} />
          </View>
        </View>
      </View>
    );
  };

  const renderSectionContent = (sectionKey) => {
    const content = displayData[sectionKey] || "●";
    const lines = content.split('\n');

    return lines.map((line, index) => (
      <Text key={index} style={styles.sectionText}>{line}</Text>
    ));
  };

  return (
    <LinearGradient
      colors={["#e9fff3", "#ffffff"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradientContainer}
    >
      {/* Header Back Button */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButtonHeader} onPress={handleBackPress}>
          <Icon name="arrow-left" size={24} color="#2e7d32" />
          <Text style={styles.backButtonTextHeader}>Back to Scanner</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollViewRef}   // 🚀 Added here
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header Card */}
        {visibleCards.includes("header") && (
          <Animated.View style={[styles.headerCard, { opacity: fadeAnim }]}>
            {renderHeaderContent()}
          </Animated.View>
        )}

        {/* Sections */}
        {Object.keys(sections).map((key) =>
          visibleCards.includes(key) && (
            <Animated.View key={key} style={[styles.sectionCard, { opacity: fadeAnim }]}>
              <Text style={styles.sectionTitle}>{key}</Text>
              {renderSectionContent(key)}
            </Animated.View>
          )
        )}

        {!isTyping && (
          <Text style={styles.footerText}>AI-powered Hair Analysis • v1.0</Text>
        )}

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
  gradientContainer: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 50 },
  centerContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  errorText: { fontSize: 18, color: "#e74c3c", marginBottom: 20 },
  header: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 10 },
  backButtonHeader: { flexDirection: 'row', alignItems: 'center', padding: 10 },
  backButtonTextHeader: { fontSize: 16, color: "#2e7d32", fontWeight: "600", marginLeft: 8 },
  headerCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 25 },
  headerTitle: { fontSize: 18, textAlign: "center", fontWeight: "700", marginBottom: 10 },
  diseaseName: { fontSize: 26, textAlign: "center", fontWeight: "bold", marginBottom: 15, color: "#00b894" },
  confidenceContainer: { alignItems: "center" },
  confidenceText: { fontSize: 16, color: "#636e72", marginBottom: 6 },
  progressBar: { width: "90%", height: 10, backgroundColor: "#dfe6e9", borderRadius: 10, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: "#00b894" },
  sectionCard: { backgroundColor: "#fff", borderRadius: 16, padding: 20, marginBottom: 20 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#00b894", marginBottom: 12 },
  sectionText: { fontSize: 16, color: "#2d3436", lineHeight: 24, marginBottom: 4 },
  footerText: { textAlign: "center", fontSize: 14, color: "#95a5a6", marginTop: 20, marginBottom: 20 },
  bottomBackButton: { backgroundColor: "#00b894", borderRadius: 25, paddingVertical: 15, alignItems: "center", marginTop: 10 },
  bottomBackButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});

export default ResultScreen;
