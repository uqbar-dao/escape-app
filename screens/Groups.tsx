import * as React from "react";
import useStore from "../hooks/useStore";
import Webview from "../components/WebView";

export default function Groups() {
  const { shipUrl } = useStore();
  return <Webview url={`${shipUrl}/apps/landscape`} />;
}
