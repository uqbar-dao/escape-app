import { useState } from "react";
import { ActivityIndicator, TouchableOpacity } from "react-native";
import { Text, View } from "../Themed";

interface ActionButtonAsyncProps {
  onPress: () => Promise<void>;
  variant?: 'destructive';
  children: any
}

export const ActionButtonAsync = ({
  onPress,
  variant,
  children
}: ActionButtonAsyncProps) => {
  const [loading, setLoading] = useState(false);

  let color;
  if (variant === 'destructive') {
    color = 'red'
  }

  const pressAndWait = async () => {
    setLoading(true);
    try {
      await onPress();
    } catch (err) {}
    setLoading(false);
  }

  if (loading) {
    return <ActivityIndicator />
  }

  return (
    <TouchableOpacity onPress={pressAndWait}>
      <View>
        <Text style={{ color }}>
          {children}
        </Text>
      </View>
    </TouchableOpacity>
  );
}
