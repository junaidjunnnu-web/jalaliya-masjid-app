import { Stack } from 'expo-router';
import { theme } from '../theme';
import { AuthProvider, useAuth } from '../lib/auth-context';
import { ActivityIndicator, View } from 'react-native';

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <>{children}</>;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AuthGuard>
        <Stack
          screenOptions={{
            headerStyle: {
              backgroundColor: theme.colors.primary,
            },
            headerTintColor: theme.colors.white,
            headerTitleStyle: {
              fontFamily: theme.typography.display,
            },
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="auth/login" options={{ headerShown: false }} />
          <Stack.Screen name="auth/register" options={{ headerShown: false }} />
          <Stack.Screen name="family/[id]" options={{ title: 'Family Details' }} />
          <Stack.Screen name="committee/[id]" options={{ title: 'Committee Member' }} />
          <Stack.Screen name="madrasa/student/[id]" options={{ title: 'Student Details' }} />
        </Stack>
      </AuthGuard>
    </AuthProvider>
  );
}
