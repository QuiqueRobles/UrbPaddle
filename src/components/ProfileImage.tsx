import React, { useState } from 'react'
import { View, Image, StyleSheet, ActivityIndicator } from 'react-native'
import { Avatar } from 'react-native-paper'

interface ProfileImageProps {
  avatarUrl: string | null
  size: number
}

export default function ProfileImage({ avatarUrl, size }: ProfileImageProps) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <>
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.image, { width: size, height: size }]}
            onLoadStart={() => setLoading(true)}
            onLoadEnd={() => setLoading(false)}
            onError={() => {
              setError(true)
              setLoading(false)
            }}
          />
          {loading && (
            <View style={[StyleSheet.absoluteFill, styles.loadingContainer]}>
              <ActivityIndicator size="large" color="#ffffff" />
            </View>
          )}
        </>
      ) : (
        <Avatar.Icon size={size} icon="account" />
      )}
      {error && <Avatar.Icon size={size} icon="alert" />}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderRadius: 9999,
  },
  image: {
    resizeMode: 'cover',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
})