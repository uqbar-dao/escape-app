import { useNavigation } from '@react-navigation/native';
import React, { useEffect } from 'react';
import { View } from '../components/Themed';


export function GoToHome() {
  const navigation = useNavigation();

  useEffect(() => {
    navigation.goBack();
  }, []);

  return (
    <View />
  );
}
