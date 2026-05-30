import type { Metadata } from "next";
import { Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { LanguageProvider } from "@/app/components/language-provider";
import { SceneProvider } from "@/app/components/scene-provider";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNavbar } from "@/app/components/site-navbar";
import { htmlLang, DEFAULT_LANGUAGE } from "@/app/lib/site-language";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["400", "600", "700"],
  variable: "--font-brand",
  display: "swap",
});

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
    <html lang={htmlLang(DEFAULT_LANGUAGE)} data-theme="light" data-scene="autumn" className={cormorant.variable} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.css" />
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var s=localStorage.getItem("site-scene");if(s)document.documentElement.dataset.scene=s}catch(e){}})()` }} />
      </head>
      <body>
        <LanguageProvider>
        <SceneProvider>
          <div className="relative min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)] transition-colors duration-300">
            <SiteNavbar />
            <main>{children}</main>
            <SiteFooter />
          </div>
        </SceneProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
