import * as React from "react";
import useStore from "../state/useStore";
import Webview from "../components/WebView";

export default function Grid() {
  const { shipUrl } = useStore();

  return <Webview url={`${shipUrl}/apps/grid/`} />;
}
