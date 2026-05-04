import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import DashboardScreen from './src/screens/DashboardScreen';
import MarketScreen from './src/screens/MarketScreen';
import SignalScreen from './src/screens/SignalScreen';
import PortfolioScreen from './src/screens/PortfolioScreen';
import NewsScreen from './src/screens/NewsScreen';

const Tab = createBottomTabNavigator();

const NepseTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    primary: '#3b82f6',
    background: '#0f172a',
    card: '#1e293b',
    text: '#e2e8f0',
    border: '#334155',
  },
};

export default function App() {
  return (
    <NavigationContainer theme={NepseTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap = 'home';
            if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
            else if (route.name === 'Market') iconName = focused ? 'trending-up' : 'trending-up-outline';
            else if (route.name === 'Signals') iconName = focused ? 'flash' : 'flash-outline';
            else if (route.name === 'Portfolio') iconName = focused ? 'briefcase' : 'briefcase-outline';
            else if (route.name === 'News') iconName = focused ? 'newspaper' : 'newspaper-outline';
            return <Ionicons name={iconName} size={size} color={color} />;
          },
          tabBarActiveTintColor: '#3b82f6',
          tabBarInactiveTintColor: '#64748b',
          tabBarStyle: { backgroundColor: '#1e293b', borderTopColor: '#334155' },
          headerStyle: { backgroundColor: '#1e293b' },
          headerTintColor: '#e2e8f0',
        })}
      >
        <Tab.Screen name="Dashboard" component={DashboardScreen} />
        <Tab.Screen name="Market" component={MarketScreen} />
        <Tab.Screen name="Signals" component={SignalScreen} />
        <Tab.Screen name="Portfolio" component={PortfolioScreen} />
        <Tab.Screen name="News" component={NewsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
