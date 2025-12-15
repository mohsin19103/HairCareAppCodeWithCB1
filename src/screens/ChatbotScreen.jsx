import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import Icon from "react-native-vector-icons/Feather";
import LinearGradient from "react-native-linear-gradient";
import axios from "axios";
import { BASE_URL } from "../config/Api";

const { width, height } = Dimensions.get("window");

// Questions configuration for hair analysis
const HAIR_ANALYSIS_QUESTIONS = [
  {
    id: "age_range",
    question: "What is your age range?",
    type: "choice",
    options: ["Under 18", "18-24", "25-34", "35-44", "45-54", "55+"],
    key: "age_range"
  },
  {
    id: "gender",
    question: "What is your gender?",
    type: "choice",
    options: ["Male", "Female", "Other/Prefer not to say"],
    key: "gender"
  },
  {
    id: "climate",
    question: "What's your local climate like?",
    type: "choice",
    options: ["Dry", "Humid", "Temperate", "Cold", "Hot"],
    key: "climate"
  },
  {
    id: "hair_length",
    question: "What is your current hair length?",
    type: "choice",
    options: ["Short", "Medium", "Long"],
    key: "hair_length"
  },
  {
    id: "scalp_type",
    question: "How would you describe your scalp type?",
    type: "choice",
    options: ["Oily", "Dry", "Normal", "Combination"],
    key: "scalp_type"
  },
  {
    id: "hair_texture",
    question: "What is your natural hair texture?",
    type: "choice",
    options: ["Straight", "Wavy", "Curly", "Coily"],
    key: "hair_texture"
  },
  {
    id: "porosity",
    question: "What is your hair porosity? (How well it absorbs moisture)",
    type: "choice",
    options: ["Low", "Medium", "High"],
    key: "porosity"
  },
  {
    id: "strand_thickness",
    question: "How thick are your individual hair strands?",
    type: "choice",
    options: ["Fine", "Medium", "Coarse"],
    key: "strand_thickness"
  },
  {
    id: "density",
    question: "What is your hair density? (Amount of hair on scalp)",
    type: "choice",
    options: ["Low", "Medium", "High"],
    key: "density"
  },
  {
    id: "primary_concerns",
    question: "Select your primary hair concerns (select all that apply):",
    type: "multichoice",
    options: ["Frizz", "Hair fall", "Dullness", "Split ends", "Breakage", "Dryness", "Oily scalp", "Dandruff", "Itchy scalp", "Slow growth"],
    key: "primary_concerns"
  },
  {
    id: "wash_frequency",
    question: "How often do you wash your hair?",
    type: "choice",
    options: ["Daily", "Every other day", "2-3 times per week", "Once a week", "Less than once a week"],
    key: "wash_frequency"
  },
  {
    id: "heat_styling_frequency",
    question: "How often do you use heat styling tools?",
    type: "choice",
    options: ["Never", "Rarely", "1-2 times per week", "2-3 times per week", "3-4 times per week", "Daily"],
    key: "heat_styling_frequency"
  },
  {
    id: "chemical_treatment_recent",
    question: "Have you had any chemical treatments recently? (coloring, perming, relaxing)",
    type: "boolean",
    key: "chemical_treatment_recent"
  },
  {
    id: "diet_quality",
    question: "How would you rate your diet quality?",
    type: "choice",
    options: ["Poor", "Fair", "Good", "Excellent"],
    key: "diet_quality"
  },
  {
    id: "stress_level",
    question: "How would you describe your current stress level?",
    type: "choice",
    options: ["Low", "Moderate", "High", "Very High"],
    key: "stress_level"
  },
  {
    id: "hard_water_area",
    question: "Do you live in a hard water area?",
    type: "boolean",
    key: "hard_water_area"
  },
  {
    id: "regular_swimming",
    question: "Do you swim regularly?",
    type: "boolean",
    key: "regular_swimming"
  },
  {
    id: "cotton_pillowcase",
    question: "Do you use cotton pillowcases?",
    type: "boolean",
    key: "cotton_pillowcase"
  },
  {
    id: "current_shampoo_type",
    question: "What type of shampoo do you currently use?",
    type: "choice",
    options: ["Volumizing shampoo", "Moisturizing shampoo", "Clarifying shampoo", "Anti-dandruff shampoo", "Color-safe shampoo", "Natural/organic shampoo"],
    key: "current_shampoo_type"
  },
  {
    id: "current_conditioner_type",
    question: "What type of conditioner do you currently use?",
    type: "choice",
    options: ["Moisturizing conditioner", "Volumizing conditioner", "Deep conditioner", "Leave-in conditioner", "Protein conditioner", "Natural/organic conditioner"],
    key: "current_conditioner_type"
  }
];

// Helper functions for formatting
const formatAnalysisText = (text) => {
  if (!text) return "No analysis available.";
  
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  const formattedParagraphs = paragraphs.map(paragraph => {
    if (paragraph.includes('•') || paragraph.includes('-')) {
      const lines = paragraph.split('\n').map(line => {
        line = line.trim();
        if (line.startsWith('•') || line.startsWith('-')) {
          return `  ◦ ${line.substring(1).trim()}`;
        }
        return line;
      });
      return lines.join('\n');
    }
    return paragraph;
  });
  
  return formattedParagraphs.join('\n\n');
};

const formatWeeklyRoutine = (routine) => {
  if (!routine) return "📅 **Weekly Routine**\nNo routine provided.";
  
  let formattedText = "📅 **Weekly Hair Care Routine**\n\n";
  
  if (routine.washing_schedule) {
    formattedText += `🧼 **Washing Schedule**\n`;
    formattedText += `• Frequency: ${routine.washing_schedule.frequency || 'Not specified'}\n`;
    if (routine.washing_schedule.method) {
      formattedText += `• Method: ${routine.washing_schedule.method}\n`;
    }
    formattedText += '\n';
  }
  
  if (routine.weekly_treatments && routine.weekly_treatments.length > 0) {
    formattedText += `💆 **Weekly Treatments**\n`;
    routine.weekly_treatments.forEach(treatment => {
      formattedText += `• ${treatment}\n`;
    });
    formattedText += '\n';
  }
  
  if (routine.deep_conditioning) {
    formattedText += `🧖 **Deep Conditioning**\n`;
    formattedText += `• Frequency: ${routine.deep_conditioning.frequency || 'As needed'}\n`;
    if (routine.deep_conditioning.type) {
      formattedText += `• Type: ${routine.deep_conditioning.type}\n`;
    }
    formattedText += '\n';
  }
  
  return formattedText.trim();
};

const formatProductRecommendations = (products) => {
  if (!products) return "🛍️ **Products**\nNo product recommendations.";
  
  let formattedText = "🛍️ **Recommended Products**\n\n";
  
  if (products.shampoo_type) {
    formattedText += `🧴 **Shampoo:** ${products.shampoo_type}\n\n`;
  }
  
  if (products.conditioner_type) {
    formattedText += `🧴 **Conditioner:** ${products.conditioner_type}\n\n`;
  }
  
  if (products.recommended_ingredients && products.recommended_ingredients.length > 0) {
    formattedText += `✅ **Ingredients to Look For:**\n`;
    products.recommended_ingredients.forEach(ingredient => {
      formattedText += `• ${ingredient}\n`;
    });
    formattedText += '\n';
  }
  
  if (products.ingredients_to_avoid && products.ingredients_to_avoid.length > 0) {
    formattedText += `❌ **Ingredients to Avoid:**\n`;
    products.ingredients_to_avoid.forEach(ingredient => {
      formattedText += `• ${ingredient}\n`;
    });
    formattedText += '\n';
  }
  
  if (products.product_examples && products.product_examples.length > 0) {
    formattedText += `🏷️ **Product Examples:**\n`;
    products.product_examples.forEach(product => {
      formattedText += `• ${product}\n`;
    });
  }
  
  return formattedText.trim();
};

const formatImmediateActions = (actions) => {
  if (!actions || actions.length === 0) return "⚡ **Immediate Actions**\nNo immediate actions needed.";
  
  let formattedText = "⚡ **Immediate Actions (This Week)**\n\n";
  
  const emojiMap = {
    'shampoo': '🧴', 'wash': '🧴', 'clean': '🧴',
    'condition': '💆', 'moistur': '💧', 'hydrat': '💧',
    'trim': '✂️', 'cut': '✂️',
    'oil': '🛢️', 'serum': '✨',
    'heat': '🔥', 'styl': '💇',
    'water': '💧', 'drink': '🥤',
    'diet': '🥗', 'food': '🥗', 'eat': '🍎',
    'sleep': '😴', 'rest': '🛌',
    'exercise': '🏃', 'workout': '💪',
    'stress': '🧘', 'relax': '😌', 'meditat': '🧘'
  };
  
  actions.forEach((action) => {
    let emoji = '✅';
    const lowerAction = action.toLowerCase();
    
    for (const [keyword, emojiChar] of Object.entries(emojiMap)) {
      if (lowerAction.includes(keyword)) {
        emoji = emojiChar;
        break;
      }
    }
    
    formattedText += `${emoji} ${action}\n`;
  });
  
  return formattedText.trim();
};

const ChatbotScreen = () => {
  const navigation = useNavigation();

  // Animation state
  const translateY = useRef(new Animated.Value(height)).current;
  const isClosingRef = useRef(false);

  // State for hair analysis
  const [userResponses, setUserResponses] = useState({});
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [selectedMultiOptions, setSelectedMultiOptions] = useState([]);

  // Chat state
  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "👋 Welcome to AI Hair Analysis! I'll ask you a few questions to provide personalized hair care recommendations.",
      isTyping: false,
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [buttons, setButtons] = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    // Animate in
    Animated.timing(translateY, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // Start with first question
    askQuestion(currentQuestionIndex);
  }, [translateY]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    Animated.timing(translateY, {
      toValue: height,
      duration: 320,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) navigation.goBack();
    });
  };

  const askQuestion = (index) => {
    if (index >= HAIR_ANALYSIS_QUESTIONS.length) {
      generateAnalysis();
      return;
    }

    const question = HAIR_ANALYSIS_QUESTIONS[index];
    const questionMessage = {
      id: Date.now(),
      sender: "bot",
      text: question.question,
      isTyping: true,
    };

    setIsBotTyping(true);
    setMessages(prev => [...prev, questionMessage]);

    setTimeout(() => {
      setIsBotTyping(false);
      setMessages(prev => prev.map(msg => 
        msg.id === questionMessage.id 
          ? { ...msg, isTyping: false }
          : msg
      ));

      if (question.type === 'choice' || question.type === 'multichoice') {
        setButtons(question.options);
      } else if (question.type === 'boolean') {
        setButtons(['Yes', 'No']);
      }
    }, 800);
  };

  const handleAnswer = (answer) => {
    const currentQuestion = HAIR_ANALYSIS_QUESTIONS[currentQuestionIndex];
    
    const userMessage = {
      id: Date.now() + 1,
      sender: "user",
      text: answer,
      isTyping: false,
    };
    setMessages(prev => [...prev, userMessage]);

    if (currentQuestion.type === 'multichoice') {
      let updatedSelection;
      if (selectedMultiOptions.includes(answer)) {
        updatedSelection = selectedMultiOptions.filter(opt => opt !== answer);
      } else {
        updatedSelection = [...selectedMultiOptions, answer];
      }
      setSelectedMultiOptions(updatedSelection);
      
      setButtons(currentQuestion.options.map(opt => 
        updatedSelection.includes(opt) ? `✓ ${opt}` : opt
      ));
      
      if (updatedSelection.length > 0 && !buttons.includes('Done')) {
        setButtons(prev => [...prev, 'Done']);
      }
      return;
    }

    const responseValue = currentQuestion.type === 'boolean' 
      ? (answer === 'Yes')
      : answer;

    setUserResponses(prev => ({
      ...prev,
      [currentQuestion.key]: responseValue
    }));

    setButtons([]);

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    setTimeout(() => {
      askQuestion(nextIndex);
    }, 500);
  };

  const completeMultiChoice = () => {
    const currentQuestion = HAIR_ANALYSIS_QUESTIONS[currentQuestionIndex];
    
    setUserResponses(prev => ({
      ...prev,
      [currentQuestion.key]: selectedMultiOptions
    }));

    setButtons([]);
    setSelectedMultiOptions([]);

    const nextIndex = currentQuestionIndex + 1;
    setCurrentQuestionIndex(nextIndex);
    
    setTimeout(() => {
      askQuestion(nextIndex);
    }, 500);
  };

  const generateAnalysis = async () => {
    setIsBotTyping(true);
    
    const loadingMessage = {
      id: Date.now(),
      sender: "bot",
      text: "🎯 Analyzing your responses...",
      isTyping: true,
    };
    setMessages(prev => [...prev, loadingMessage]);

    try {
      const requestBody = {
        age_range: userResponses.age_range || "25-34",
        gender: userResponses.gender || "Male",
        climate: userResponses.climate || "Temperate",
        hair_length: userResponses.hair_length || "Medium",
        scalp_type: userResponses.scalp_type || "Normal",
        hair_texture: userResponses.hair_texture || "Straight",
        porosity: userResponses.porosity || "Medium",
        strand_thickness: userResponses.strand_thickness || "Medium",
        density: userResponses.density || "Medium",
        primary_concerns: userResponses.primary_concerns || ["Hair fall"],
        wash_frequency: userResponses.wash_frequency || "Every other day",
        heat_styling_frequency: userResponses.heat_styling_frequency || "Rarely",
        chemical_treatment_recent: userResponses.chemical_treatment_recent || false,
        diet_quality: userResponses.diet_quality || "Good",
        stress_level: userResponses.stress_level || "Moderate",
        hard_water_area: userResponses.hard_water_area || false,
        regular_swimming: userResponses.regular_swimming || false,
        cotton_pillowcase: userResponses.cotton_pillowcase || true,
        current_shampoo_type: userResponses.current_shampoo_type || "Volumizing shampoo",
        current_conditioner_type: userResponses.current_conditioner_type || "Moisturizing conditioner"
      };

      const response = await axios.post(`${BASE_URL}/api/hair-analysis/analyze`, requestBody);
      
      const result = response.data;
      setAnalysisResult(result);
      setIsAnalysisComplete(true);

      setMessages(prev => prev.filter(msg => !msg.isTyping));
      
      const completeMessage = {
        id: Date.now() + 1,
        sender: "bot",
        text: "✅ **Analysis Complete!**\nHere's your personalized hair care plan:",
        isTyping: true,
      };
      setMessages(prev => [...prev, completeMessage]);

      setTimeout(() => {
        setIsBotTyping(false);
        setMessages(prev => prev.map(msg => 
          msg.id === completeMessage.id 
            ? { ...msg, isTyping: false }
            : msg
        ));

        displayAnalysisResults(result);
      }, 1000);

    } catch (error) {
      console.error("Error generating analysis:", error);
      setIsBotTyping(false);
      
      setMessages(prev => {
        const filtered = prev.filter(msg => !msg.isTyping);
        return [
          ...filtered,
          {
            id: Date.now(),
            sender: "bot",
            text: "Sorry, I encountered an error generating your analysis. Please try again.",
            isTyping: false,
          },
        ];
      });
    }
  };

  const displayAnalysisResults = (result) => {
    // Display Summary
    const summaryMessage = {
      id: Date.now() + 2,
      sender: "bot",
      text: `✨ **Hair Profile Summary**\n\n${result.hair_profile_summary || "No summary available."}`,
      isTyping: true,
    };
    setMessages(prev => [...prev, summaryMessage]);

    // Display AI Analysis
    setTimeout(() => {
      const analysisMessage = {
        id: Date.now() + 3,
        sender: "bot",
        text: `🔍 **Detailed Analysis**\n\n${formatAnalysisText(result.ai_analysis)}`,
        isTyping: true,
      };
      setMessages(prev => [...prev, analysisMessage]);
    }, 1200);

    // Display Weekly Routine
    setTimeout(() => {
      const routineMessage = {
        id: Date.now() + 4,
        sender: "bot",
        text: formatWeeklyRoutine(result.weekly_routine),
        isTyping: true,
      };
      setMessages(prev => [...prev, routineMessage]);
    }, 2400);

    // Display Product Recommendations
    setTimeout(() => {
      const productsMessage = {
        id: Date.now() + 5,
        sender: "bot",
        text: formatProductRecommendations(result.product_recommendations),
        isTyping: true,
      };
      setMessages(prev => [...prev, productsMessage]);
    }, 3600);

    // Display Immediate Actions
    setTimeout(() => {
      const actionsMessage = {
        id: Date.now() + 6,
        sender: "bot",
        text: formatImmediateActions(result.immediate_actions),
        isTyping: true,
      };
      setMessages(prev => [...prev, actionsMessage]);
      
      // Final message with options
      setTimeout(() => {
        const finalMessage = {
          id: Date.now() + 7,
          sender: "bot",
          text: "🎉 **Your Personalized Hair Care Plan is Complete!**\n\nWould you like to save this plan or start a new analysis?",
          isTyping: true,
        };
        setMessages(prev => [...prev, finalMessage]);
        
        setTimeout(() => {
          setIsBotTyping(false);
          setMessages(prev => prev.map(msg => 
            msg.id === finalMessage.id 
              ? { ...msg, isTyping: false }
              : msg
          ));
          setButtons(["💾 Save Plan", "🔄 New Analysis"]);
        }, 800);
      }, 1200);
    }, 4800);
  };

  const savePlan = () => {
    setIsBotTyping(true);
    
    const savingMessage = {
      id: Date.now(),
      sender: "bot",
      text: "💾 Saving your hair care plan...",
      isTyping: true,
    };
    setMessages(prev => [...prev, savingMessage]);
    
    setTimeout(() => {
      setIsBotTyping(false);
      setMessages(prev => {
        const filtered = prev.filter(msg => msg.sender !== "bot" || !msg.text.includes("Saving"));
        return [
          ...filtered,
          {
            id: Date.now() + 1,
            sender: "bot",
            text: "✅ Your hair care plan has been saved to your profile! You can access it anytime from your profile section.",
            isTyping: false,
          },
        ];
      });
      setButtons(["🔄 New Analysis"]);
    }, 1500);
  };

  const restartAnalysis = () => {
    setUserResponses({});
    setCurrentQuestionIndex(0);
    setIsAnalysisComplete(false);
    setAnalysisResult(null);
    setSelectedMultiOptions([]);
    setMessages([
      {
        id: Date.now(),
        sender: "bot",
        text: "🔄 Starting new hair analysis...",
        isTyping: false,
      },
    ]);
    setButtons([]);

    setTimeout(() => {
      askQuestion(0);
    }, 1000);
  };

  const handleButtonAction = (action) => {
    if (action === "💾 Save Plan") {
      savePlan();
    } else if (action === "🔄 New Analysis") {
      restartAnalysis();
    }
  };

  const handleSubmit = async (text) => {
    if (isBotTyping) return;
    
    let thisText = null;
    if (typeof text === "string" && text.trim()) {
      thisText = text;
    } else {
      thisText = inputText.trim();
    }
    if (!thisText) return;

    // Handle special actions after analysis
    if (isAnalysisComplete) {
      if (thisText === "💾 Save Plan" || thisText === "🔄 New Analysis") {
        handleButtonAction(thisText);
        return;
      }
    }

    const currentQuestion = HAIR_ANALYSIS_QUESTIONS[currentQuestionIndex];
    
    if (currentQuestion?.type === 'multichoice') {
      if (thisText === 'Done') {
        completeMultiChoice();
        return;
      }
      if (thisText.startsWith('✓ ')) {
        thisText = thisText.substring(2);
      }
      handleAnswer(thisText);
      return;
    }

    handleAnswer(thisText);
    setInputText("");
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages, buttons]);

  const formatMessageText = (text) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={index} style={styles.boldText}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return <Text key={index}>{part}</Text>;
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          { transform: [{ translateY }] },
        ]}
      >
        <LinearGradient colors={["#e8f5e9", "#ffffff"]} style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.headerIcon} onPress={handleClose}>
              <Icon name="chevron-down" size={24} color="#2e7d32" />
            </TouchableOpacity>
            <Text style={styles.headerText}>Diagnose with Ai</Text>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="settings" size={22} color="#2e7d32" />
            </TouchableOpacity>
          </View>

          {/* Progress indicator */}
          {!isAnalysisComplete && HAIR_ANALYSIS_QUESTIONS[currentQuestionIndex] && (
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>
                Question {currentQuestionIndex + 1} of {HAIR_ANALYSIS_QUESTIONS.length}
              </Text>
              <View style={styles.progressBar}>
                <View 
                  style={[
                    styles.progressFill, 
                    { width: `${((currentQuestionIndex + 1) / HAIR_ANALYSIS_QUESTIONS.length) * 100}%` }
                  ]} 
                />
              </View>
            </View>
          )}

          {/* Chat Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={styles.chatContent}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              msg.text && msg.text.trim() !== "" ? (
                <View
                  key={msg.id}
                  style={[
                    styles.message,
                    msg.sender === "bot" ? styles.botMessage : styles.userMessage,
                    msg.isTyping && styles.typingMessage,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.sender === "bot" ? styles.botText : styles.userText,
                      msg.isTyping && styles.typingText,
                    ]}
                  >
                    {formatMessageText(msg.text)}
                    {msg.isTyping && msg.sender === "bot" && (
                      <Text style={styles.cursor}>|</Text>
                    )}
                  </Text>
                </View>
              ) : null
            ))}
            
            {/* Action Buttons */}
            {buttons.length > 0 && !isBotTyping && (
              <View style={styles.buttonsContainer}>
                {buttons.map((buttonText, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.optionsButton,
                      buttonText.startsWith('✓ ') && styles.selectedOptionButton,
                      (buttonText === "💾 Save Plan" || buttonText === "🔄 New Analysis") && styles.actionButton
                    ]}
                    onPress={() => handleSubmit(buttonText)}
                  >
                    <Text style={[
                      styles.optionsText,
                      buttonText.startsWith('✓ ') && styles.selectedOptionText,
                      (buttonText === "💾 Save Plan" || buttonText === "🔄 New Analysis") && styles.actionButtonText
                    ]}>
                      {buttonText}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type your answer..."
                placeholderTextColor="#81c784"
                multiline
                value={inputText}
                onChangeText={setInputText}
                editable={!isBotTyping && !isAnalysisComplete}
                onSubmitEditing={() => handleSubmit(inputText)}
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (isBotTyping || isAnalysisComplete) && styles.disabledSendButton
                ]}
                onPress={() => handleSubmit(inputText)}
                activeOpacity={0.8}
                disabled={isBotTyping || isAnalysisComplete}
              >
                <Icon name="send" size={20} color="#fff" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 15,
    paddingTop: Platform.OS === "android" ? 25 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    marginBottom: 10,
  },
  headerText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2e7d32",
  },
  headerIcon: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: "#f1f8e9",
  },
  progressContainer: {
    marginBottom: 15,
    paddingHorizontal: 5,
  },
  progressText: {
    fontSize: 14,
    color: "#2e7d32",
    marginBottom: 5,
    fontWeight: "500",
  },
  progressBar: {
    height: 6,
    backgroundColor: "#e8f5e9",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2e7d32",
    borderRadius: 3,
  },
  chatArea: {
    flex: 1,
  },
  chatContent: {
    paddingBottom: 20,
  },
  message: {
    maxWidth: "85%",
    padding: 14,
    borderRadius: 18,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f8fdf8",
    borderBottomLeftRadius: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#4caf50',
    marginLeft: 5,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2e7d32",
    borderBottomRightRadius: 4,
  },
  typingMessage: {
    backgroundColor: "#e8f5e9",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  boldText: {
    fontWeight: '700',
    color: '#1b5e20',
  },
  botText: {
    color: "#2e7d32",
  },
  userText: {
    color: "#fff",
  },
  typingText: {
    fontStyle: "italic",
  },
  cursor: {
    color: "#2e7d32",
    fontWeight: "bold",
    opacity: 0.7,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffffee",
    borderRadius: 30,
    paddingHorizontal: 15,
    marginBottom: Platform.OS === "ios" ? 20 : 10,
    minHeight: 50,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  input: {
    flex: 1,
    color: "#2e7d32",
    paddingVertical: 10,
    paddingHorizontal: 10,
    maxHeight: 120,
    fontSize: 15,
  },
  sendButton: {
    backgroundColor: "#2e7d32",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 8,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 3,
  },
  disabledSendButton: {
    backgroundColor: "#81c784",
    opacity: 0.6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 10,
    gap: 8,
  },
  optionsButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#e8ecef',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  selectedOptionButton: {
    backgroundColor: '#2e7d32',
  },
  actionButton: {
    backgroundColor: '#4caf50',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 5,
  },
  optionsText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  selectedOptionText: {
    color: '#fff',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default ChatbotScreen;