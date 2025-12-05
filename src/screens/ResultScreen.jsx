import React, { useState, useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  ScrollView, 
  StyleSheet, 
  Animated, 
  TouchableOpacity,
  BackHandler,
  SafeAreaView,
  Dimensions,
  Platform
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import MaterialIcon from "react-native-vector-icons/MaterialIcons";

const { width, height } = Dimensions.get('window');

const ResultScreen = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const responseData = route?.params?.responseData;
  const [displayData, setDisplayData] = useState({});
  const [isTyping, setIsTyping] = useState(true);
  const [completedCards, setCompletedCards] = useState([]);
  const [currentTypingCard, setCurrentTypingCard] = useState('header');
  const [allCardsVisible, setAllCardsVisible] = useState(true); // All cards visible
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef(null);
  const isTypingRef = useRef(true);
  const typingIntervalRef = useRef(null);

  // Handle back button
  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      navigation.navigate('Scanner');
      return true;
    });

    return () => {
      backHandler.remove();
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
    };
  }, []);

  if (!responseData || !responseData.result) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <MaterialIcon name="error-outline" size={60} color="#ff6b6b" />
          <Text style={styles.errorTitle}>Analysis Not Found</Text>
          <Text style={styles.errorSubtitle}>
            Please try scanning again
          </Text>
          <TouchableOpacity 
            style={styles.errorButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <MaterialIcon name="camera-alt" size={18} color="#fff" />
            <Text style={styles.errorButtonText}>New Scan</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const { result } = responseData;
  const { sections } = result;

  const cardOrder = [
    { 
      key: 'header', 
      title: 'MEDICAL ANALYSIS', 
      icon: 'assignment',
      color: '#00b894',
      subtitle: 'AI Diagnosis Report'
    },
    { 
      key: 'Definition', 
      title: 'CONDITION', 
      icon: 'info',
      color: '#3498db',
      subtitle: 'Definition'
    },
    { 
      key: 'Causes', 
      title: 'CAUSES', 
      icon: 'warning',
      color: '#e74c3c',
      subtitle: 'Root Factors'
    },
    { 
      key: 'Solutions', 
      title: 'SOLUTIONS', 
      icon: 'healing',
      color: '#2ecc71',
      subtitle: 'Treatment'
    },
    { 
      key: 'Recommendations', 
      title: 'ADVICE', 
      icon: 'local-hospital',
      color: '#9b59b6',
      subtitle: 'Recommendations'
    },
    { 
      key: 'Preventive Tips', 
      title: 'PREVENTION', 
      icon: 'shield',
      color: '#f39c12',
      subtitle: 'Preventive Tips'
    }
  ].filter(item => item.key === 'header' || sections[item.key]);

  const formatSectionContent = (content) => {
    if (Array.isArray(content)) {
      let formattedText = "";
      content.forEach((item, index) => {
        if (item.text && item.items) {
          formattedText += `• ${item.text}\n`;
          item.items.forEach((subItem) => {
            formattedText += `   ◦ ${subItem}\n`;
          });
          if (index < content.length - 1) formattedText += '\n';
        } else if (item.text) {
          formattedText += `• ${item.text}\n\n`;
        }
      });
      return formattedText.trim();
    }
    return content?.text || "Analysis in progress...";
  };

  // Fast type all cards immediately
  const startTypingAllCards = () => {
    isTypingRef.current = true;
    
    // First, show all cards with empty content
    const initialDisplayData = {};
    cardOrder.forEach(card => {
      if (card.key === 'header') {
        initialDisplayData[card.key] = "";
      } else {
        initialDisplayData[card.key] = "";
      }
    });
    setDisplayData(initialDisplayData);
    
    // Start typing header first
    typeCardContent('header', 0);
  };

  // Type content for a specific card
  const typeCardContent = async (cardKey, index) => {
    setCurrentTypingCard(cardKey);

    let content = "";
    if (cardKey === 'header') {
      content = `Diagnosis\n${result.disease}\n\nConfidence\n${result.confidence.toFixed(1)}%`;
    } else {
      content = formatSectionContent(sections[cardKey]);
    }

    // Start typing this card
    const typingSpeed = 10; // Faster typing
    let i = 0;
    
    const typingInterval = setInterval(() => {
      if (i <= content.length) {
        setDisplayData(prev => ({ 
          ...prev, 
          [cardKey]: content.substring(0, i) 
        }));
        i++;
      } else {
        clearInterval(typingInterval);
        
        // Mark as completed
        setCompletedCards(prev => [...prev, cardKey]);
        setCurrentTypingCard(null);
        
        // Start next card if exists
        if (index < cardOrder.length - 1) {
          setTimeout(() => {
            typeCardContent(cardOrder[index + 1].key, index + 1);
          }, 300);
        } else {
          // All cards completed
          setIsTyping(false);
          isTypingRef.current = false;
        }
      }
    }, typingSpeed);
    
    typingIntervalRef.current = typingInterval;
  };

  // Start typing on mount
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();

    // Show all cards immediately
    setAllCardsVisible(true);
    
    // Start typing after a brief delay
    setTimeout(() => {
      startTypingAllCards();
    }, 400);
  }, []);

  const renderCard = (card, index) => {
    if (!allCardsVisible && card.key !== 'header' && !completedCards.includes(card.key) && card.key !== currentTypingCard) {
      return null;
    }

    const content = displayData[card.key] || "";
    const isCompleted = completedCards.includes(card.key);
    const isCurrentlyTyping = currentTypingCard === card.key;
    const isHeader = card.key === 'header';

    return (
      <Animated.View 
        key={card.key}
        style={[
          styles.card,
          { 
            opacity: fadeAnim,
            borderLeftWidth: 3,
            borderLeftColor: card.color,
            marginTop: index === 0 ? 0 : 12,
          }
        ]}
      >
        {/* Card Header */}
        <View style={[styles.cardHeader, { backgroundColor: `${card.color}08` }]}>
          <View style={[styles.cardIconContainer, { backgroundColor: card.color }]}>
            <MaterialIcon 
              name={card.icon} 
              size={20} 
              color="#fff" 
            />
          </View>
          <View style={styles.cardTitleContainer}>
            <Text style={styles.cardTitle}>
              {card.title}
            </Text>
            <Text style={styles.cardSubtitle}>
              {card.subtitle}
            </Text>
          </View>
          {!isHeader && (
            <View style={[
              styles.statusBadge,
              isCompleted && styles.statusCompleted,
              isCurrentlyTyping && styles.statusTyping
            ]}>
              <MaterialIcon 
                name={isCompleted ? "check" : isCurrentlyTyping ? "more-horiz" : "schedule"} 
                size={10} 
                color="#fff" 
              />
              <Text style={styles.statusText}>
                {isCompleted ? 'DONE' : isCurrentlyTyping ? 'TYPING' : 'WAITING'}
              </Text>
            </View>
          )}
        </View>

        {/* Card Content */}
        <View style={styles.cardContent}>
          {isHeader ? (
            <View style={styles.headerContent}>
              <View style={styles.diseaseRow}>
                <MaterialIcon name="medical-services" size={18} color="#00b894" />
                <Text style={styles.diseaseLabel}>Diagnosis:</Text>
                <Text style={styles.diseaseName}>
                  {result.disease}
                </Text>
              </View>
              
              <View style={styles.confidenceRow}>
                <MaterialIcon name="speed" size={18} color="#00b894" />
                <Text style={styles.confidenceLabel}>Confidence:</Text>
                <Text style={styles.confidenceValue}>
                  {result.confidence.toFixed(1)}%
                </Text>
                <View style={styles.progressBar}>
                  <View style={[
                    styles.progressFill, 
                    { width: `${Math.min(result.confidence, 100)}%` }
                  ]} />
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.sectionContent}>
              <Text style={styles.cardText}>
                {content}
                {isCurrentlyTyping && <Text style={styles.cursor}>|</Text>}
              </Text>
            </View>
          )}
        </View>

        {/* Footer */}
        {isCompleted && (
          <View style={[styles.cardFooter, { borderTopColor: `${card.color}20` }]}>
            <MaterialIcon 
              name="check-circle" 
              size={14} 
              color={card.color} 
            />
            <Text style={[styles.cardFooterText, { color: card.color }]}>
              ✓ Completed
            </Text>
          </View>
        )}
      </Animated.View>
    );
  };

  const progressPercentage = (completedCards.length / cardOrder.length) * 100;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.topHeader}>
        <View style={styles.headerRow}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.navigate('Scanner')}
          >
            <MaterialIcon name="arrow-back" size={22} color="#2e7d32" />
          </TouchableOpacity>
          
          <View style={styles.headerCenter}>
            <MaterialIcon name="biotech" size={18} color="#00b894" />
            <Text style={styles.headerTitle}>AI Medical Analysis</Text>
          </View>
          
          <View style={styles.progressCircle}>
            <Text style={styles.progressNumber}>
              {completedCards.length}
            </Text>
            <Text style={styles.progressSlash}>/</Text>
            <Text style={styles.progressTotal}>{cardOrder.length}</Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFillBar, { width: `${progressPercentage}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {currentTypingCard 
              ? `Typing ${cardOrder.find(c => c.key === currentTypingCard)?.title.toLowerCase()}...`
              : isTyping ? 'Starting...' : 'Complete!'
            }
          </Text>
        </View>
      </View>

      {/* Main Content - FREE SCROLLING */}
      <ScrollView 
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        bounces={true}
      >
        <View style={styles.cardsContainer}>
          {cardOrder.map((card, index) => renderCard(card, index))}
        </View>

        {/* Completion Section */}
        {!isTyping && (
          <View style={styles.completionCard}>
            <View style={styles.completionHeader}>
              <MaterialIcon name="check-circle" size={28} color="#00b894" />
              <Text style={styles.completionTitle}>Analysis Complete</Text>
            </View>
            <Text style={styles.completionText}>
              All {cardOrder.length} sections have been analyzed
            </Text>
            
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcon name="assignment" size={16} color="#00b894" />
                <Text style={styles.statNumber}>{cardOrder.length}</Text>
                <Text style={styles.statLabel}>Sections</Text>
              </View>
              <View style={styles.statItem}>
                <MaterialIcon name="speed" size={16} color="#00b894" />
                <Text style={styles.statNumber}>{result.confidence.toFixed(1)}%</Text>
                <Text style={styles.statLabel}>Confidence</Text>
              </View>
            </View>
            
            <View style={styles.actionRow}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => navigation.navigate('Scanner')}
              >
                <MaterialIcon name="camera-alt" size={18} color="#fff" />
                <Text style={styles.actionButtonText}>New Scan</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#fff',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2c3e50',
    marginTop: 15,
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: '#7f8c8d',
    textAlign: 'center',
    marginBottom: 25,
  },
  errorButton: {
    flexDirection: 'row',
    backgroundColor: '#00b894',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 25,
    alignItems: 'center',
  },
  errorButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 8,
  },
  // Header
  topHeader: {
    paddingTop: Platform.OS === 'ios' ? 10 : 5,
    paddingBottom: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e8f5e9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 3,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f9f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1b5e20',
    marginLeft: 8,
  },
  progressCircle: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e8f5e9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#00b894',
  },
  progressSlash: {
    fontSize: 12,
    color: '#95a5a6',
    marginHorizontal: 2,
  },
  progressTotal: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  progressContainer: {
    paddingHorizontal: 16,
  },
  progressTrack: {
    height: 3,
    backgroundColor: '#e8f5e9',
    borderRadius: 1.5,
    overflow: 'hidden',
    marginBottom: 4,
  },
  progressFillBar: {
    height: '100%',
    backgroundColor: '#00b894',
    borderRadius: 1.5,
  },
  progressLabel: {
    fontSize: 11,
    color: '#7f8c8d',
    fontWeight: '500',
  },
  // Scroll View - ENABLED
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  cardsContainer: {
    // No gap - individual margins
  },
  // Cards
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingVertical: 12,
  },
  cardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardTitleContainer: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    minWidth: 50,
    justifyContent: 'center',
  },
  statusCompleted: {
    backgroundColor: '#2ecc71',
  },
  statusTyping: {
    backgroundColor: '#3498db',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 4,
  },
  cardContent: {
    padding: 14,
    paddingTop: 0,
  },
  headerContent: {
    paddingTop: 10,
    gap: 12,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  diseaseLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 8,
    marginRight: 6,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#2c3e50',
    flex: 1,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  confidenceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7f8c8d',
    marginLeft: 8,
    marginRight: 6,
  },
  confidenceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#00b894',
    marginRight: 10,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#ecf0f1',
    borderRadius: 3,
    overflow: 'hidden',
    minWidth: 80,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#00b894',
    borderRadius: 3,
  },
  sectionContent: {
    paddingTop: 10,
  },
  cardText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#34495e',
  },
  cursor: {
    color: '#00b894',
    fontWeight: 'bold',
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderTopWidth: 1,
    justifyContent: 'center',
    gap: 6,
  },
  cardFooterText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  // Completion
  completionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#e8f5e9',
    alignItems: 'center',
  },
  completionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  completionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#00b894',
    marginLeft: 8,
  },
  completionText: {
    fontSize: 14,
    color: '#7f8c8d',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: '#00b894',
    marginTop: 5,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: '#7f8c8d',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#00b894',
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
});

export default ResultScreen;