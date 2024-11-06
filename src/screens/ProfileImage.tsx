import React from 'react'
import { View, Image, StyleSheet } from 'react-native'
import { Avatar } from 'react-native-paper'

interface ProfileImageProps {
  avatarUrl: string | null
  size: number
}

export default function ProfileImage({ avatarUrl, size }: ProfileImageProps) {
  return (
    <View style={styles.container}>
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          onError={(e) => console.error('Error loading image:', e.nativeEvent.error)}
        />
      ) : (
        <Avatar.Icon size={size} icon="account" />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    resizeMode: 'cover',
  },
})