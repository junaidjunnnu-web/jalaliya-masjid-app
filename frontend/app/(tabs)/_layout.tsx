import { Tabs } from 'expo-router';
import { theme } from '../../theme';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.gray[500],
        tabBarStyle: {
          backgroundColor: theme.colors.white,
          borderTopColor: theme.colors.gray[200],
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <TabIcon name="home" color={color} />,
        }}
      />
      <Tabs.Screen
        name="namaz"
        options={{
          title: 'Namaz',
          tabBarIcon: ({ color }) => <TabIcon name="time" color={color} />,
        }}
      />
      <Tabs.Screen
        name="members"
        options={{
          title: 'Members',
          tabBarIcon: ({ color }) => <TabIcon name="people" color={color} />,
        }}
      />
      <Tabs.Screen
        name="madrasa"
        options={{
          title: 'Madrasa',
          tabBarIcon: ({ color }) => <TabIcon name="book" color={color} />,
        }}
      />
      <Tabs.Screen
        name="committee"
        options={{
          title: 'Committee',
          tabBarIcon: ({ color }) => <TabIcon name="users" color={color} />,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'More',
          tabBarIcon: ({ color }) => <TabIcon name="menu" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color }: { name: string; color: string }) {
  let iconName: React.ComponentProps<typeof Ionicons>['name'];
  
  switch (name) {
    case 'home':
      iconName = 'home-outline';
      break;
    case 'time':
      iconName = 'time-outline';
      break;
    case 'people':
      iconName = 'people-outline';
      break;
    case 'book':
      iconName = 'book-outline';
      break;
    case 'users':
      iconName = 'people-circle-outline';
      break;
    case 'menu':
      iconName = 'menu-outline';
      break;
    default:
      iconName = 'help-circle-outline';
  }

  return <Ionicons name={iconName} size={24} color={color} />;
}
