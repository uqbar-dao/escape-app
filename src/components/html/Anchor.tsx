import { Linking, TouchableOpacity } from "react-native";
import { Text, View } from "../Themed";

interface AnchorProps {
  href: string;
  children: any;
  style?: any;
}

export const Anchor = ({ children, href, style = {} }: AnchorProps) => {
  return (
    <TouchableOpacity onPress={() => Linking.openURL(href)}>
      {typeof children === 'string' ? (
        <Text style={{ ...style, borderBottomWidth: 1 }}>
          {children}
        </Text>
      ) : (
        <View style={{ ...style, borderBottomWidth: 1 }}>
          {children}
        </View>
      )}
    </TouchableOpacity>
  );
}
