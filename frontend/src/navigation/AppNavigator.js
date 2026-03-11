import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { useAuth } from '../context/AuthContext';
import { COLORS } from '../utils/theme';

import LoginScreen from '../screens/LoginScreen';
import SignupScreen from '../screens/SignupScreen';
import DashboardScreen from '../screens/DashboardScreen';
import LeadsScreen from '../screens/LeadsScreen';
import LeadDetailScreen from '../screens/LeadDetailScreen';
import LeadFormScreen from '../screens/LeadFormScreen';

const Stack = createStackNavigator();

// Common header style keeps app screens visually consistent.
const commonHeader = {
  headerStyle: { backgroundColor: COLORS.primaryDark },
  headerTintColor: '#fff',
  headerTitleStyle: { fontWeight: '700' },
};

const AppNavigator = () => {
  const { isAuthenticated, loading } = useAuth();

  // Show loader while saved auth state is being restored.
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.background }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      {/* Authenticated users get main app stack; others get auth stack. */}
      {isAuthenticated ? (
        <Stack.Navigator screenOptions={commonHeader}>
          <Stack.Screen name="Dashboard" component={DashboardScreen} options={{ title: 'Dashboard' }} />
          <Stack.Screen name="Leads" component={LeadsScreen} options={{ title: 'Leads' }} />
          <Stack.Screen name="LeadDetail" component={LeadDetailScreen} options={{ title: 'Lead Details' }} />
          <Stack.Screen name="LeadForm" component={LeadFormScreen} options={{ title: 'Lead' }} />
        </Stack.Navigator>
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
};

export default AppNavigator;
