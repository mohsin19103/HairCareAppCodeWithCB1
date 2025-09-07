import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import AgeSelectionScreen from "./src/screens/AgeSelectionScreen";
import StartScreen from "./src/screens/StartScreen";
import LoginScreen from "./src/screens/LoginScreen";
import SignupScreen from "./src/screens/SignupScreen";
import GenderSelectionScreen from "./src/screens/GenderSelectionScreen";
import FamilyHistoryScreen from "./src/screens/FamilyHistoryScreen";
import PastHairConditionsScreen from "./src/screens/PastHairConditionsScreen";
import Scanner from "./src/screens/Scanner";
import CameraScreen from "./src/screens/CameraScreen";
import OnboardS from "./src/screens/OnboardS";
import ResultsScreen from "./src/screens/ResultsScreen";
import ChatbotScreen from "./src/screens/ChatbotScreen";
import Toast from "react-native-toast-message";
import VerificationScreen from "./src/screens/VerificationScreen";
import Feedback from "./src/screens/Feedback";
import Report from "./src/screens/Report";
import ProfileScreen from "./src/screens/ProfileScreen";

const Stack = createNativeStackNavigator();

const App = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="StartScreen"
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#f8faf8" },
          animation: "slide_from_right", // default animation for all screens
        }}
      >
        {/* Auth Screens */}
        <Stack.Group>
          <Stack.Screen name="StartScreen" component={StartScreen} />
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignupScreen" component={SignupScreen} />
          <Stack.Screen
            name="VerificationScreen"
            component={VerificationScreen}
          />
        </Stack.Group>

        {/* Onboarding Screens */}
        <Stack.Group>
          <Stack.Screen
            name="AgeSelectionScreen"
            component={AgeSelectionScreen}
          />
          <Stack.Screen
            name="GenderSelectionScreen"
            component={GenderSelectionScreen}
          />
          <Stack.Screen
            name="FamilyHistoryScreen"
            component={FamilyHistoryScreen}
          />
          <Stack.Screen
            name="PastHairConditionsScreen"
            component={PastHairConditionsScreen}
          />
        </Stack.Group>

        {/* Main App Screens */}
        <Stack.Group>
          <Stack.Screen name="CameraScreen" component={CameraScreen} />
          <Stack.Screen name="Feedback" component={Feedback} />
          <Stack.Screen name="Scanner" component={Scanner} />
          <Stack.Screen name="Report" component={Report} />
          <Stack.Screen name="ResultsScreen" component={ResultsScreen} />
          <Stack.Screen name="profileScreen" component={ProfileScreen} />


          {/* ✅ Chatbot behaves like modal (opens bottom→top, closes top→bottom) */}
        <Stack.Screen
  name="Chatbot"
  component={ChatbotScreen}
  options={{
    presentation: "modal", // behaves like modal
    animation: "slide_from_bottom", // open bottom → top
    gestureDirection: "vertical", // allows swipe down to close
     // iOS-like smooth animation
  }}
/>
        </Stack.Group>

        {/* Modal Screens */}
        <Stack.Group
          screenOptions={{
            presentation: "transparentModal",
            animation: "slide_from_right",
            gestureEnabled: true,
            contentStyle: { backgroundColor: "transparent" },
          }}
        >
          <Stack.Screen name="OnboardS" component={OnboardS} />
        </Stack.Group>
      </Stack.Navigator>
      <Toast />
    </NavigationContainer>
  );
};

export default App;
