import React from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { useTheme } from '../hooks/useTheme';

interface UserAvatarProps {
  photoURL?: string | null;
  displayName?: string | null;
  email?: string | null;
  size?: number;
  fontSize?: number;
}

const UserAvatar: React.FC<UserAvatarProps> = ({
  photoURL,
  displayName,
  email,
  size = 40,
  fontSize = 16,
}) => {
  const { colors } = useTheme();
  
  const getInitial = (): string => {
    if (displayName) {
      return displayName.charAt(0).toUpperCase();
    } else if (email) {
      return email.charAt(0).toUpperCase();
    }
    return '?';
  };

  const avatarStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  const textStyle = {
    fontSize: fontSize,
  };

  if (photoURL) {
    return (
      <Image 
        source={{ uri: photoURL }} 
        style={[styles.image, avatarStyle]}
      />
    );
  }

  return (
    <View style={[styles.container, avatarStyle, { backgroundColor: colors.primary }]}>
      <Text style={[styles.text, textStyle]}>{getInitial()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
  text: {
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

export default UserAvatar;
