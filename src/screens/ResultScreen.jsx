import React from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useRoute } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

const ResultScreen = () => {
  const route = useRoute();
  const responseData = route?.params?.responseData;

  if (!responseData || !responseData.result) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ No data available</Text>
      </View>
    );
  }

  const { result } = responseData;
  const { sections } = result;

  const renderSectionItem = (item, sectionKey, index) => {
    if (item.text && item.items) {
      return (
        <View key={`${sectionKey}-${index}`} style={styles.itemContainer}>
          <Text style={styles.sectionText}>• {item.text}</Text>
          {item.items.map((subItem, subIndex) => (
            <Text
              key={`${sectionKey}-${index}-item-${subIndex}`}
              style={styles.listItem}
            >
              {"   "}◦ {subItem}
            </Text>
          ))}
        </View>
      );
    } else if (item.text) {
      return (
        <Text key={`${sectionKey}-${index}`} style={styles.listItem}>
          • {item.text}
        </Text>
      );
    }
    return (
      <Text key={`${sectionKey}-${index}`} style={styles.errorText}>
        Invalid item format
      </Text>
    );
  };

  const renderSectionContent = (content, sectionKey) => {
    if (Array.isArray(content)) {
      return content.map((item, index) =>
        renderSectionItem(item, sectionKey, index)
      );
    } else if (content.text && !content.items) {
      return <Text style={styles.sectionText}>{content.text}</Text>;
    } else if (content.text && Array.isArray(content.items)) {
      return (
        <View style={styles.itemContainer}>
          <Text style={styles.sectionText}>{content.text}</Text>
          {content.items.map((subItem, index) => (
            <Text key={`${sectionKey}-item-${index}`} style={styles.listItem}>
              • {subItem}
            </Text>
          ))}
        </View>
      );
    }
    return <Text style={styles.errorText}>Invalid section format</Text>;
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
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>Diagnosis Report</Text>
          <Text style={styles.diseaseName}>{result.disease}</Text>

          {/* Confidence Bar */}
          <View style={styles.confidenceContainer}>
            <Text style={styles.confidenceText}>
              Confidence: {result.confidence.toFixed(2)}%
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${result.confidence}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Sections */}
        {Object.keys(sections).map((sectionKey) => (
          <View key={sectionKey} style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>{sectionKey}</Text>
            {renderSectionContent(sections[sectionKey], sectionKey)}
          </View>
        ))}

        <Text style={styles.footerText}>AI-powered Hair Analysis • v1.0</Text>
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

  // Footer
  footerText: {
    textAlign: "center",
    fontSize: 14,
    color: "#95a5a6",
    marginTop: 20,
  },
});

export default ResultScreen;
 