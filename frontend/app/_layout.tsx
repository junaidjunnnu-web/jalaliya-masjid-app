import { Stack } from 'expo-router';
import { theme } from '../theme';

export default function RootLayout() {
  return (
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
      <Stack.Screen name="family/[id]" options={{ title: 'Family Details' }} />
      <Stack.Screen name="committee/[id]" options={{ title: 'Committee Member' }} />
      <Stack.Screen name="madrasa/student/[id]" options={{ title: 'Student Details' }} />
    </Stack>
  );
}
