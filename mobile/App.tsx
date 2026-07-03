import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ProgressProvider } from './src/state/progress';
import { PacksProvider } from './src/state/packs';
import { RootNavigator } from './src/navigation/RootNavigator';
import './src/services/silenceAutoplayNoise';

export default function App() {
  return (
    <SafeAreaProvider>
      <ProgressProvider>
        <PacksProvider>
          <NavigationContainer>
            <StatusBar style="dark" />
            <RootNavigator />
          </NavigationContainer>
        </PacksProvider>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}
