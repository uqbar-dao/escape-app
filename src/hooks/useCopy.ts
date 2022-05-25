import { useCallback, useMemo, useState } from 'react';

export function useCopy(copied: string, display?: string | Element, replaceText?: string | Element) {
  const [didCopy, setDidCopy] = useState(false);
  const doCopy = useCallback(() => {
    setDidCopy(true);
    setTimeout(() => {
      setDidCopy(false);
    }, 2000);
  }, [copied]);

  const copyDisplay = useMemo(() => (didCopy ? (replaceText ?? 'Copied') : display), [
    didCopy,
    display
  ]);

  return { copyDisplay, doCopy, didCopy };
}
