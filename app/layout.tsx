import type { Metadata } from "next";
import "./globals.css";
import { LanguageProvider } from "@/app/components/language-provider";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNavbar } from "@/app/components/site-navbar";
import { PixelChicken } from "@/app/components/pixel-chicken";
import { htmlLang, DEFAULT_LANGUAGE } from "@/app/lib/site-language";

export const metadata: Metadata = {
  title: {
    default: "MOONSILVER",
    template: "%s | MOONSILVER",
  },
  description: "MOONSILVER website",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={htmlLang(DEFAULT_LANGUAGE)} data-theme="light" suppressHydrationWarning>
      <head>
        <link rel="preload" href="/fonts/press-start-2p-latin-400.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="stylesheet" href="/fonts/fusion-pixel/fusion-pixel.css" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("site-theme");if(t!=="light"&&t!=="dark"){t=window.matchMedia("(prefers-color-scheme: light)").matches?"light":"dark"}document.documentElement.dataset.theme=t}catch(e){}})()`,
          }}
        />
      </head>
      <body>
        <LanguageProvider>
          <div className="relative min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)] transition-colors duration-300">
            <SiteNavbar />
            <main>{children}</main>
            <SiteFooter />
            <PixelChicken />
          </div>
        </LanguageProvider>
      </body>
    </html>
  );
}
