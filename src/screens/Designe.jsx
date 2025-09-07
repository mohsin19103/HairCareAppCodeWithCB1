// components/Icons.js
import React from 'react';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AntDesign from 'react-native-vector-icons/AntDesign';
import Entypo from 'react-native-vector-icons/Entypo';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const Designe = ({ type, name, size, color }) => {
  switch (type) {
    case 'FontAwesome':
      return <FontAwesome name={name} size={size} color={color} />;
    case 'AntDesign':
      return <AntDesign name={name} size={size} color={color} />;
    case 'Entypo':
      return <Entypo name={name} size={size} color={color} />;
    case 'MaterialIcons':
      return <MaterialIcons name={name} size={size} color={color} />;
    case 'Ionicons':
      return <Ionicons name={name} size={size} color={color} />;
    default:
      return <FontAwesome name="question-circle" size={size} color={color} />; // Default icon
  }
};

export default Designe;