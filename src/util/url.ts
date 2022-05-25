const ABOUT_URLS = ['about:blank', 'about:srcdoc']

export const isInternalUrl = (url: string, shipUrl: string) => {
  const lower = url.toLowerCase();

  return lower.includes(shipUrl.toLowerCase()) || ABOUT_URLS.includes(lower);
}
