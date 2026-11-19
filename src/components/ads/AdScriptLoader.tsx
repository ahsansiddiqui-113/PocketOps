import Script from "next/script";

export function AdScriptLoader({ isPro }: { isPro: boolean }) {
  const clientId = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID;
  if (isPro || !clientId || clientId.includes("0000000000000000")) {
    return null;
  }

  return (
    <Script
      id="adsense-script"
      async
      src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${clientId}`}
      crossOrigin="anonymous"
      strategy="afterInteractive"
    />
  );
}
