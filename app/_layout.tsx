import { View } from 'react-native';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { AppProvider } from '../src/context/AppContext';
import { RootNavigator } from '../src/navigation/RootNavigator';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  useFrameworkReady();

  return (
    <View style={{ flex: 1 }}>
      <AppProvider>
        <RootNavigator />
      </AppProvider>
      <StatusBar style="auto" />
    </View>
  );
}
