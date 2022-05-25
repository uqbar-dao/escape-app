import { Text, View } from "react-native";

export const BLUE = 'rgb(33, 157, 255)';

export const UnreadIndicator = ({ unread }: { unread: number }) => {
  if (unread < 1) {
    return null;
  }

  return (
    <View style={{ display: 'flex', flexDirection: 'row', justifyContent: 'center', backgroundColor: BLUE, paddingHorizontal: 2, height: 15, borderRadius: 8, marginLeft: -8, marginTop: -2 }}>
      <Text style={{ fontSize: 12, color: 'white', minWidth: 11, textAlign: 'center' }}>
        {unread}
      </Text>
    </View>
  );
};
