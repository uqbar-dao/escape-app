import { ReactNode } from "react";
import { Text } from "../Themed";

export const H1 = ({ children }: { children: ReactNode }) => {
  return (
    <Text style={{ fontSize: 40, fontWeight: '700' }}>
      {children}
    </Text>
  );
}

export const H2 = ({ children }: { children: ReactNode }) => {
  return (
    <Text style={{ fontSize: 32, fontWeight: '700' }}>
      {children}
    </Text>
  );
}

export const H3 = ({ children }: { children: ReactNode }) => {
  return (
    <Text style={{ fontSize: 24, fontWeight: '700' }}>
      {children}
    </Text>
  );
}

export const H4 = ({ children }: { children: ReactNode }) => {
  return (
    <Text style={{ fontSize: 16, fontWeight: '700' }}>
      {children}
    </Text>
  );
}
