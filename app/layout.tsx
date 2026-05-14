import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/components/auth-provider";
import { LanguageProvider } from "@/app/components/language-provider";
import { SiteFooter } from "@/app/components/site-footer";
import { SiteNavbar } from "@/app/components/site-navbar";
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
    <html lang={htmlLang(DEFAULT_LANGUAGE)} data-theme="dark" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          <AuthProvider>
            <div className="min-h-screen bg-[var(--app-bg)] text-[var(--app-fg)] transition-colors duration-300">
              <SiteNavbar />
              <main>{children}</main>
              <SiteFooter />
            </div>
          </AuthProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
