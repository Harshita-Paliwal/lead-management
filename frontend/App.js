import React from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { COLORS } from './src/utils/theme';

const App = () => (
  <GestureHandlerRootView style={{ flex: 1 }}>
    <AuthProvider>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.primaryDark} />
      <AppNavigator />
    </AuthProvider>
  </GestureHandlerRootView>
);

export default App;
