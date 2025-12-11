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
  SafeAreaView,
} from "react-native";
import { Camera, useCameraDevice } from "react-native-vision-camera";
import { useNavigation } from "@react-navigation/native";
import { launchImageLibrary } from 'react-native-image-picker';

const { width, height } = Dimensions.get("window");

const CameraScreen = () => {
  const device = useCameraDevice("back");
  const cameraRef = useRef(null);
  const navigation = useNavigation();

  const [photos, setPhotos] = useState([]);
  const [isCameraActive, setIsCameraActive] = useState(true);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [lastCapturedPhoto, setLastCapturedPhoto] = useState(null);

  const currentView = "top"; 
  const guideImage = require("../assets/top.jpg"); 

  const viewTitle = "Top View";
  const viewInstruction = "Take a photo of your hair from the top angle";

  const startAnalysis = () => {
    navigation.navigate("ResultsScreen", { photos });
  };

  const requestPermissions = async () => {
    const cameraPermission = await Camera.requestCameraPermission();
    const microphonePermission = await Camera.requestMicrophonePermission();

    if (Platform.OS === "android") {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE
      );
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
      );
    }

    if (
      cameraPermission !== "authorized" ||
      microphonePermission !== "authorized"
    ) {
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
        const photoPath = `file://${photo.path}`;
        setLastCapturedPhoto(photoPath);
        setIsCameraActive(false);
      } catch (error) {
        console.error("Error taking photo:", error);
      }
    }
  };

  const openGalleryForCurrentView = async () => {
    try {
      const options = {
        mediaType: 'photo',
        includeBase64: false,
        maxHeight: 800,
        maxWidth: 800,
        quality: 0.8,
      };

      launchImageLibrary(options, (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
        } else if (response.assets && response.assets.length > 0) {
          const selectedAsset = response.assets[0];
          const selectedPhoto = {
            view: currentView,
            path: selectedAsset.uri,
          };
          setLastCapturedPhoto(selectedAsset.uri);
          setIsCameraActive(false);
          setTimeout(() => {
            confirmPhotoFromGallery(selectedPhoto);
          }, 100);
        }
      });
    } catch (error) {
      console.error('Error opening gallery:', error);
    }
  };

  const confirmPhotoFromGallery = (selectedPhoto) => {
    setPhotos([selectedPhoto]);
    setShowAllPhotos(true);
    setLastCapturedPhoto(null);
  };

  const confirmPhoto = () => {
    if (!lastCapturedPhoto) return;
    const photoToAdd = { view: currentView, path: lastCapturedPhoto };
    setPhotos([photoToAdd]);
    setShowAllPhotos(true);
    setLastCapturedPhoto(null);
  };

  const retakePhoto = () => {
    setLastCapturedPhoto(null);
    setIsCameraActive(true);
  };

  const retakeSpecificPhoto = () => {
    setPhotos([]);
    setLastCapturedPhoto(null);
    setIsCameraActive(true);
    setShowAllPhotos(false);
  };

  if (!device) return <Text>Loading Camera...</Text>;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hair Health Scan</Text>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.closeButton}>×</Text>
        </TouchableOpacity>
      </View>

      {showAllPhotos ? (
        <View style={styles.allPhotosContainer}>
          <Text style={styles.allPhotosTitle}>Review Your Photo</Text>
          <ScrollView contentContainerStyle={styles.photosGrid}>
            {photos.map((photo, index) => (
              <View key={index} style={styles.photoCard}>
                <Image
                  source={{ uri: photo.path }}
                  style={styles.capturedImage}
                  resizeMode="cover"
                />
                <Text style={styles.photoLabel}>{viewTitle}</Text>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={retakeSpecificPhoto}
                >
                  <Text style={styles.secondaryButtonText}>Retake</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>

          {photos.length > 0 && (
            <TouchableOpacity style={styles.primaryButton} onPress={startAnalysis}>
              <Text style={styles.primaryButtonText}>Start Analysis</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : isCameraActive ? (
        <View style={styles.cameraViewContainer}>
          <View style={styles.guideContainer}>
            <Text style={styles.viewTitle}>{viewTitle}</Text>
            <Image
              source={guideImage}
              style={styles.guideImage}
              resizeMode="contain"
            />
            <Text style={styles.guideText}>{viewInstruction}</Text>
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

          <View style={styles.bottomButtonsContainer}>
            <TouchableOpacity 
              style={styles.galleryButton} 
              onPress={openGalleryForCurrentView}
            >
              <Text style={styles.galleryButtonText}>📁 Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.captureButton} onPress={takePhoto}>
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <View style={styles.emptyView} />
          </View>
        </View>
      ) : (
        <View style={styles.previewContainer}>
          <View style={styles.guideContainer}>
            <Text style={styles.viewTitle}>{viewTitle}</Text>
            {lastCapturedPhoto && (
              <Image
                source={{ uri: lastCapturedPhoto }}
                style={styles.previewImage}
                resizeMode="contain"
              />
            )}
          </View>

          <View style={styles.previewButtons}>
            <TouchableOpacity style={styles.secondaryButton} onPress={retakePhoto}>
              <Text style={styles.secondaryButtonText}>Retake</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.primaryButton} onPress={confirmPhoto}>
              <Text style={styles.primaryButtonText}>Use This Photo</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: "#a8d5b9",
  },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#0b8a46" },
  closeButton: { fontSize: 28, color: "#0b8a46" },
  cameraViewContainer: { flex: 1, justifyContent: "space-between" },
  guideContainer: { alignItems: "center", paddingHorizontal: 20, paddingTop: 10 },
  viewTitle: { fontSize: 20, fontWeight: "600", marginBottom: 8, color: "#0b8a46" },
  guideImage: { width: width * 0.4, height: height * 0.15, borderRadius: 16, marginBottom: 10 },
  guideText: { fontSize: 15, textAlign: "center", color: "#333" },
  cameraContainer: {
    width: "90%",
    height: height * 0.5,
    borderRadius: 20,
    overflow: "hidden",
    alignSelf: "center",
    backgroundColor: "#000",
  },
  cameraView: { flex: 1 },
  bottomButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    marginBottom: 30,
  },
  galleryButton: {
    backgroundColor: "#e6f5ec",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#0b8a46",
  },
  galleryButtonText: { color: "#0b8a46", fontSize: 16, fontWeight: "600" },
  captureButton: {
    width: 78,
    height: 78,
    borderRadius: 39,
    borderWidth: 3,
    borderColor: "#0b8a46",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(11,138,70,0.1)",
  },
  captureButtonInner: { width: 58, height: 58, borderRadius: 29, backgroundColor: "#0b8a46" },
  emptyView: { width: 80 },
  previewContainer: { flex: 1, justifyContent: "space-between" },
  previewImage: { width: width * 0.95, height: height * 0.5, borderRadius: 16, alignSelf: "center", borderWidth: 1, borderColor: "#a8d5b9" },
  previewButtons: { flexDirection: "row", justifyContent: "space-around", paddingHorizontal: 20, paddingBottom: 30 },
  primaryButton: { backgroundColor: "#0b8a46", paddingVertical: 14, paddingHorizontal: 25, borderRadius: 30, alignItems: "center", minWidth: width * 0.35 },
  primaryButtonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  secondaryButton: { backgroundColor: "#e6f5ec", paddingVertical: 14, paddingHorizontal: 25, borderRadius: 30, alignItems: "center", minWidth: width * 0.35 },
  secondaryButtonText: { color: "#0b8a46", fontSize: 16, fontWeight: "500" },
  allPhotosContainer: { flex: 1, paddingTop: 20, paddingBottom: 30, justifyContent: 'space-between' },
  allPhotosTitle: { fontSize: 20, fontWeight: "600", textAlign: "center", marginBottom: 20, color: "#0b8a46" },
  photosGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", paddingBottom: 20, alignItems: 'center' },
  photoCard: { width: width * 0.45, margin: 8, alignItems: "center" },
  capturedImage: { width: "100%", height: 150, borderRadius: 16, borderWidth: 1, borderColor: "#a8d5b9" },
  photoLabel: { fontSize: 14, marginTop: 5, color: "#0b8a46" },
});

export default CameraScreen;
