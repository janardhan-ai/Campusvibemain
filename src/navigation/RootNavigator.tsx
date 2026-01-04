import React from 'react';
import { NavigationContainer, NavigationIndependentTree } from '@react-navigation/native';
import { useApp } from '../context/AppContext';
import { AuthStack } from './AuthStack';
import { AppTabs } from './AppTabs';

export const RootNavigator = () => {
  const { currentUser } = useApp();

  return (
    <NavigationIndependentTree>
      <NavigationContainer>
        {currentUser ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </NavigationIndependentTree>
  );
};
