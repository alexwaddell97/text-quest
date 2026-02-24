import React from "react";
import type { Metadata } from "next";
import { Space_Grotesk, Manrope } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context";
import Providers from "./providers";
import { getSession } from "@/auth";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import OnboardingTour from "@/components/OnboardingTour";

const display = Space_Grotesk({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-manrope",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Roleplaying Realm | Infinite Words, Infinite Possibilities",
  description: "A place where you can create your own worlds and stories.",
  manifest: "/site.webmanifest",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48", type: "image/x-icon" },
    ],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: [
      { url: "/android-chrome-192x192.png", sizes: "192x192", type: "image/png" },
      { url: "/android-chrome-512x512.png", sizes: "512x512", type: "image/png" },
    ],
    other: [
      { rel: "mask-icon", url: "/logo.svg", color: "#b91c1c" },
    ],
  },
};

type LayoutFlags = {
  fullWidth: boolean;
  immersive: boolean;
  lockShell: boolean;
};

const detectLayoutFlags = (node: React.ReactNode): LayoutFlags => {
  for (const child of React.Children.toArray(node)) {
    if (!React.isValidElement(child)) {
      continue;
    }
    const childProps = child.props as Record<string, unknown> & { children?: React.ReactNode };
    const fullWidth = Boolean(childProps?.["data-full-width"]);
    const immersive = Boolean(childProps?.["data-immersive"]);
    const lockShell = Boolean(childProps?.["data-lock-shell"]);
    if (fullWidth || immersive || lockShell) {
      return { fullWidth, immersive, lockShell };
    }
    const nested = detectLayoutFlags(childProps?.children);
    if (nested.fullWidth || nested.immersive || nested.lockShell) {
      return nested;
    }
  }
  return { fullWidth: false, immersive: false, lockShell: false };
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const rawSession = await getSession();
  const session = rawSession ? JSON.parse(JSON.stringify(rawSession)) : null;
  const { fullWidth: shouldBypassShell, immersive: isImmersive, lockShell } = detectLayoutFlags(children);

  return (
    <html lang="en">
      <body
        className={`${display.variable} ${manrope.variable} overflow-x-hidden`}
        style={{ background: "var(--bg)", color: "var(--text)" }}
      >
        <Providers session={session}>
          <ThemeProvider>
            <div className={`flex w-full flex-col ${isImmersive ? "h-screen" : "min-h-screen"}`}>
              {!isImmersive && <Header />}
              <OnboardingTour />
              <main className={`flex-1 min-h-0 h-full w-full ${(isImmersive || lockShell) ? "overflow-hidden" : ""}`}>
                {shouldBypassShell ? (
                  children
                ) : (
                  <div className="w-full h-full min-h-screen">
                    {children}
                  </div>
                )}
              </main>
              {!isImmersive && <Footer />}
            </div>
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
