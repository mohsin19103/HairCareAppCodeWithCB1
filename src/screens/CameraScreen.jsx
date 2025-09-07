import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Dimensions,
  ScrollView,
  SafeAreaView
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useNavigation } from "@react-navigation/native";

const { width, height } = Dimensions.get("window");

const CameraScreen = () => {
  const device = useCameraDevice("back");
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const [photos, setPhotos] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [currentView, setCurrentView] = useState("top");
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState(null);

  const guideImages = {
    top: require("../assets/top.jpg"),
    left: require("../assets/left.jpg"),
    right: require("../assets/right.jpg"),
    back: require("../assets/back.jpg"),
  };

  const viewTitles = {
    top: "Top View",
    left: "Left View",
    right: "Right View",
    back: "Back View",
  };

  const viewInstructions = {
    top: "Take a photo of your hair from the top angle",
    left: "Take a photo of the left side of your head",
    right: "Take a photo of the right side of your head",
    back: "Take a photo of the back of your head",
  };

  const startAnalysis = () => {
    navigation.navigate("ResultsScreen");
  };

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
    }

    if (cameraPermission !== "authorized" || microphonePermission !== "authorized") {
      console.warn("Permissions not granted!");
    }
  };

  useEffect(() => {
    requestPermissions();
  }, []);

  const takePhoto = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePhoto();
        setLastCapturedPhoto(photo.path);
        setIsCameraActive(false);
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  };

  const confirmPhoto = () => {
    setPhotos((prevPhotos) => {
      const newPhotos = [...prevPhotos, { view: currentView, path: lastCapturedPhoto }];
      if (newPhotos.length === 4) {
        setShowAllPhotos(true);
      } else {
        const viewsOrder = ["top", "left", "right", "back"];
        const currentIndex = viewsOrder.indexOf(currentView);
        if (currentIndex < viewsOrder.length - 1) {
          setCurrentView(viewsOrder[currentIndex + 1]);
          setIsCameraActive(true);
        }
      }
      return newPhotos;
    });
    setLastCapturedPhoto(null);
  };

  const retakePhoto = () => {
    setLastCapturedPhoto(null);
    setIsCameraActive(true);
  };

  const retakeSpecificPhoto = (view) => {
    setPhotos((prevPhotos) => prevPhotos.filter((photo) => photo.view !== view));
    setCurrentView(view);
    setIsCameraActive(true);
    setShowAllPhotos(false);
  };

  if (!device) return <Text>Loading Camera...</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hair Scan</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      {/* All Photos Review */}
      {showAllPhotos ? (
        <View style={styles.allPhotosContainer}>
          <Text style={styles.allPhotosTitle}>Review Your Photos</Text>
          <ScrollView contentContainerStyle={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoCard}>
                <Image
                  source={{ uri: "file://" + photo.path }}
                  style={styles.capturedImage}
                  resizeMode="cover"
                />
                <Text style={styles.photoLabel}>{viewTitles[photo.view]}</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => retakeSpecificPhoto(photo.view)}
                >
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          <TouchableOpacity style={styles.primaryButton} onPress={startAnalysis}>
            <Text style={styles.primaryButtonText}>Start Analysis</Text>
          </TouchableOpacity>
        </View>
      ) : isCameraActive ? (
        /* Camera View */
        <View style={styles.cameraViewContainer}>
          <View style={styles.guideContainer}>
            <Text style={styles.viewTitle}>{viewTitles[currentView]}</Text>
            <Image
              source={guideImages[currentView]}
              style={styles.guideImage}
              resizeMode="contain"
            />
            <Text style={styles.guideText}>{viewInstructions[currentView]}</Text>
          </View>

          <View style={styles.cameraContainer}>
            <Camera
              ref={cameraRef}
              style={styles.cameraView}
              device={device}
              isActive={true}
              photo={true}
            />
          </View>

          <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
            <View style={styles.captureButtonInner} />
          </TouchableOpacity>
        </View>
      ) : (
        /* Preview View */
        <View style={styles.previewContainer}>
          <View style={styles.guideContainer}>
            <Text style={styles.viewTitle}>{viewTitles[currentView]}</Text>
            <Image
              source={{ uri: "file://" + lastCapturedPhoto }}
              style={styles.previewImage}
              resizeMode="contain"
            />
          </View>

          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={retakePhoto}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={confirmPhoto}>
              <Text style={styles.primaryButtonText}>Next</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#e5e5e5",
  },
  headerTitle: { fontSize: 20, fontWeight: "600", color: "#111" },
  closeButton: { fontSize: 28, color: "#555" },

  cameraViewContainer: { flex: 1, justifyContent: "space-between" },
  guideContainer: { alignItems: "center", paddingHorizontal: 20, paddingTop: 10 },
  viewTitle: { fontSize: 20, fontWeight: "500", marginBottom: 8, color: "#111" },
  guideImage: { width: width * 0.4, height: height * 0.15, borderRadius: 16, marginBottom: 10 },
  guideText: { fontSize: 15, textAlign: "center", color: "#666" },

  cameraContainer: {
    width: "90%",
    height: height * 0.5,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#000",
  },
  cameraView: { flex: 1 },

  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: "#007AFF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,122,255,0.1)",
    alignSelf: "center",
    marginBottom: 30,
  },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#007AFF" },

  previewContainer: { flex: 1, justifyContent: "space-between" },
  previewImage: {
    width: width * 0.95,
    height: height * 0.5,
    borderRadius: 16,
    alignSelf: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  previewButtons: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, paddingBottom: 30 },

  primaryButton: {
    backgroundColor: "#007AFF",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    minWidth: width * 0.35,
  },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },

  secondaryButton: {
    backgroundColor: "#f2f2f7",
    paddingVertical: 14,
    paddingHorizontal: 25,
    borderRadius: 30,
    alignItems: "center",
    minWidth: width * 0.35,
  },
  secondaryButtonText: { color: "#111", fontSize: 16, fontWeight: "500" },

  allPhotosContainer: { flex: 1, paddingTop: 20, paddingBottom: 30 },
  allPhotosTitle: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 20, color: "#111" },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingBottom: 20 },
  photoCard: { width: width * 0.45, margin: 8, alignItems: "center" },
  capturedImage: { width: "100%", height: 150, borderRadius: 16, borderWidth: 1, borderColor: "#e0e0e0" },
  photoLabel: { fontSize: 14, marginTop: 5, color: "#444" },
});

export default CameraScreen;
