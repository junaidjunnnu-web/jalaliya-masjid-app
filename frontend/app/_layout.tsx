import { Stack } from 'expo-router';
import { theme } from '../theme';
import { AuthProvider } from '../lib/auth-context';

export default function RootLayout() {
  return (
    <AuthProvider>
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
    </AuthProvider>
  );
}
