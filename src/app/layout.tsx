import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context";


const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({  subsets: ['latin'],
display: 'swap',
variable: '--font-poppins',
weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']})

export const metadata: Metadata = {
  title: "InfiniteWorlds.ai | Infinite Words, Infinite Possibilities",
  description: "A place where you can create your own worlds and stories.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${poppins.variable} overflow-x-hidden`}>
        <main className="w-screen h-screen bg-cover bg-center md:pb-0 pb-24 bg-white flex flex-col items-center">
          <ThemeProvider>
          {children}
          </ThemeProvider>
          </main></body>
    </html>
  );
}
