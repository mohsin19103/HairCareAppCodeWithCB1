import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
  SafeAreaView,
  ScrollView,
  Image,
  TextInput,
} from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";

const { width, height } = Dimensions.get("window");

const ProductScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [favorites, setFavorites] = useState({});
  
  // Sample product data with local image references
  const products = [
    { 
      id: 1, 
      name: "Hydrating Shampoo", 
      category: "Shampoo", 
      price: "$23", 
      rating: 4.5, 
      image: require('../assets/procard1.jpg')
    },
    { 
      id: 2, 
      name: "Repair Conditioner", 
      category: "Conditioner", 
      price: "$23", 
      rating: 4.2, 
      image: require('../assets/procard2.jpg')
    },
    { 
      id: 3, 
      name: "Scalp Serum", 
      category: "Treatment", 
      price: "$35", 
      rating: 4.7, 
      image: require('../assets/procard3.jpg')
    },
    { 
      id: 4, 
      name: "Hair Growth Oil", 
      category: "Oil", 
      price: "$28", 
      rating: 4.8, 
      image: require('../assets/procard4.jpg')
    },
    { 
      id: 5, 
      name: "Volumizing Mousse", 
      category: "Styling", 
      price: "$18", 
      rating: 4.0, 
      image: require('../assets/procard5.jpg')
    },
    { 
      id: 6, 
      name: "Anti-Frizz Cream", 
      category: "Treatment", 
      price: "$25", 
      rating: 4.3, 
      image: require('../assets/procard6.jpg')
    },
    { 
      id: 7, 
      name: "Clarifying Shampoo", 
      category: "Shampoo", 
      price: "$22", 
      rating: 4.6, 
      image: require('../assets/procard7.jpg')
    },
    { 
      id: 8, 
      name: "Deep Conditioner", 
      category: "Conditioner", 
      price: "$26", 
      rating: 4.4, 
      image: require('../assets/procard8.jpg')
    },
  ];

  const toggleFavorite = (productId) => {
    setFavorites(prev => ({
      ...prev,
      [productId]: !prev[productId]
    }));
  };

  const categories = ["All", "Shampoo", "Conditioner", "Treatment", "Oil", "Styling"];

  return (
    <SafeAreaView style={styles.safeArea}>
      <LinearGradient colors={["#e8f5e9", "#ffffff"]} style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Hair Products</Text>
          <TouchableOpacity onPress={() => navigation.navigate("OnboardS")}>
            <Ionicons name="settings-outline" size={24} color="#2e7d32" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#4f4f4f" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search hair products"
              placeholderTextColor="#8a8a8a"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Ionicons name="close-circle" size={20} color="#4f4f4f" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Compact Categories Row */}
        <View style={styles.categoriesContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContent}
          >
            {categories.map((category, index) => (
              <TouchableOpacity 
                key={index} 
                style={[
                  styles.categoryButton,
                  selectedCategory === category && styles.categoryButtonActive
                ]}
                onPress={() => setSelectedCategory(category)}
              >
                <Text style={[
                  styles.categoryText,
                  selectedCategory === category && styles.categoryTextActive
                ]}>
                  {category}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Products Grid */}
        <ScrollView 
          style={styles.productsContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          
          <View style={styles.productsGrid}>
            {products
              .filter(product => selectedCategory === "All" || product.category === selectedCategory)
              .map((product) => (
              <TouchableOpacity key={product.id} style={styles.productCard}>
                <View style={styles.productImageContainer}>
                  {/* Render the actual image */}
                  <Image 
                    source={product.image} 
                    style={styles.productImage}
                    resizeMode="cover"
                  />
                  <TouchableOpacity 
                    style={styles.favoriteButton}
                    onPress={() => toggleFavorite(product.id)}
                  >
                    <Ionicons 
                      name={favorites[product.id] ? "heart" : "heart-outline"} 
                      size={18} 
                      color={favorites[product.id] ? "#ff4081" : "#2e7d32"} 
                    />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.productInfo}>
                  <Text style={styles.productCategory}>{product.category}</Text>
                  <Text style={styles.productName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#FFD700" />
                    <Text style={styles.ratingText}>{product.rating}</Text>
                  </View>
                  
                  <View style={styles.priceContainer}>
                    <Text style={styles.productPrice}>{product.price}</Text>
                    <TouchableOpacity style={styles.addButton}>
                      <Ionicons name="add-circle" size={26} color="#2e7d32" />
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>

        {/* Navigation Bar */}
        <View style={styles.navigationBar}>
          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate("Scanner")}
          >
            <Ionicons name="home-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Home</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate("Chatbot")}
          >
            <Ionicons name="chatbubbles-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>AI Chat</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="leaf-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>weekly plan</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.navItem}
            onPress={() => navigation.navigate("UserHistory")}
          >
            <Ionicons name="person-outline" size={26} color="#4f4f4f" />
            <Text style={styles.navText}>Hair History</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="flask-outline" size={26} color="#2e7d32" />
            <Text style={[styles.navText, styles.activeNavText]}>Products</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#e8f5e9",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "android" ? 30 : 0,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
    marginTop: 10,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#2e7d32",
    textShadowColor: "rgba(0, 0, 0, 0.25)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  searchContainer: {
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 30,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#4f4f4f",
  },
  categoriesContainer: {
    height: 40,
    marginBottom: 10,
  },
  categoriesContent: {
    alignItems: "center",
    paddingRight: 10,
  },
  categoryButton: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 1,
    height: 32,
    justifyContent: "center",
  },
  categoryButtonActive: {
    backgroundColor: "#2e7d32",
    shadowColor: "#2e7d32",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 3,
    elevation: 2,
  },
  categoryText: {
    color: "#2e7d32",
    fontWeight: "500",
    fontSize: 12,
  },
  categoryTextActive: {
    color: "#ffffff",
    fontWeight: "600",
  },
  productsContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#2e7d32",
    marginBottom: 15,
    textShadowColor: "rgba(0, 0, 0, 0.1)",
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  productsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  productCard: {
    width: width * 0.43,
    backgroundColor: "#ffffff",
    borderRadius: 12,
    marginBottom: 15,
    padding: 10,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  productImageContainer: {
    position: "relative",
    alignItems: "center",
    marginBottom: 8,
  },
  productImage: {
    width: "100%",
    height: 110,
    borderRadius: 8,
    backgroundColor: "#f5f5f5", // Fallback color if image doesn't load
  },
  favoriteButton: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1,
  },
  productInfo: {
    paddingHorizontal: 2,
  },
  productCategory: {
    fontSize: 10,
    color: "#4f4f4f",
    marginBottom: 2,
  },
  productName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
    marginBottom: 6,
    lineHeight: 18,
    height: 36,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  ratingText: {
    marginLeft: 4,
    color: "#4f4f4f",
    fontSize: 12,
    fontWeight: "500",
  },
  priceContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  productPrice: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#2e7d32",
  },
  addButton: {
    padding: 1,
  },
  spacer: {
    height: 100,
  },
  navigationBar: {
    borderTopColor: "#a5d6a7",
    flexDirection: "row",
    justifyContent: "space-around",
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 10,
    position: "absolute",
    bottom: 5,
    left: 20,
    right: 20,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  navItem: {
    alignItems: "center",
    minWidth: 50,
  },
  navText: {
    color: "#4f4f4f",
    fontSize: 10,
    marginTop: 4,
  },
  activeNavText: {
    color: "#2e7d32",
    fontWeight: "600",
  },
});

export default ProductScreen;