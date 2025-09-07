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

const { width, height } = Dimensions.get("window");

const ChatbotScreen = () => {
  const navigation = useNavigation();

  // --- slide in/out animation state ---
  const translateY = useRef(new Animated.Value(height)).current; // start off-screen (bottom)
  const isClosingRef = useRef(false);

  const [messages, setMessages] = useState([
    {
      id: 1,
      sender: "bot",
      text: "👋 Hello! How can I help with your hair today?",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const scrollRef = useRef();

  useEffect(() => {
    // Animate in: bottom -> center
    Animated.timing(translateY, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [translateY]);

  const handleClose = () => {
    if (isClosingRef.current) return;
    isClosingRef.current = true;

    // Animate out: center -> bottom (top-to-bottom visual when closing)
    Animated.timing(translateY, {
      toValue: height,
      duration: 320,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) navigation.goBack();
    });
  };

  const handleSend = () => {
    if (!inputText.trim()) return;

    const newMessage = { id: Date.now(), sender: "user", text: inputText };
    setMessages((prev) => [...prev, newMessage]);
    setInputText("");

    // Simulate bot reply
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          sender: "bot",
          text: "✨ Thanks for sharing! I'm analyzing your concern...",
        },
      ]);
    }, 1000);
  };

  useEffect(() => {
    scrollRef.current?.scrollToEnd({ animated: true });
  }, [messages]);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Animated sheet container */}
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
            <Text style={styles.headerText}>AI Hair Assistant</Text>
            <TouchableOpacity style={styles.headerIcon}>
              <Icon name="settings" size={22} color="#2e7d32" />
            </TouchableOpacity>
          </View>

          {/* Chat Area */}
          <ScrollView
            ref={scrollRef}
            style={styles.chatArea}
            contentContainerStyle={{ paddingBottom: 20 }}
            keyboardShouldPersistTaps="handled"
          >
            {messages.map((msg) => (
              <View
                key={msg.id}
                style={[
                  styles.message,
                  msg.sender === "bot" ? styles.botMessage : styles.userMessage,
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    msg.sender === "bot" ? styles.botText : styles.userText,
                  ]}
                >
                  {msg.text}
                </Text>
              </View>
            ))}
          </ScrollView>

          {/* Input Area */}
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={Platform.OS === "ios" ? 70 : 0}
          >
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Message..."
                placeholderTextColor="#81c784"
                multiline
                value={inputText}
                onChangeText={setInputText}
              />
              <TouchableOpacity
                style={styles.sendButton}
                onPress={handleSend}
                activeOpacity={0.8}
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
  chatArea: {
    flex: 1,
  },
  message: {
    maxWidth: "80%",
    padding: 14,
    borderRadius: 20,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
  },
  botMessage: {
    alignSelf: "flex-start",
    backgroundColor: "#f1f8e9",
    borderBottomLeftRadius: 4,
  },
  userMessage: {
    alignSelf: "flex-end",
    backgroundColor: "#2e7d32",
    borderBottomRightRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
  },
  botText: {
    color: "#2e7d32",
  },
  userText: {
    color: "#fff",
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
});

export default ChatbotScreen;
