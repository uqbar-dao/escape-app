import { StyleProp, TouchableOpacity, ViewStyle } from "react-native";
import { useNav } from "../../hooks/useNav";

export interface LinkProps {
  to: string;
  title?: string;
  style?: StyleProp<ViewStyle>
  children: any;
  onPress?: () => void;
}

export const Link = ({ to, title, children, style, onPress }: LinkProps) => {
  const { navigate } = useNav();

  return (
    <TouchableOpacity style={style} onPress={() => {
      navigate(to, title);
      if (onPress)
        onPress();
    }}>
      {children}
    </TouchableOpacity>
  );
}
