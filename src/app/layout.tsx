import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context";
import Providers from "./providers";
import { getSession } from "@/auth";
import { getServerSession } from "next-auth";

const inter = Inter({ subsets: ["latin"] });
const poppins = Poppins({  subsets: ['latin'],
display: 'swap',
variable: '--font-poppins',
weight: ['100', '200', '300', '400', '500', '600', '700', '800', '900']})

export const metadata: Metadata = {
  title: "Roleplaying Realm | Infinite Words, Infinite Possibilities",
  description: "A place where you can create your own worlds and stories.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const session = await getSession();

  return (
    <html lang="en">
      <body className={`${poppins.variable} overflow-x-hidden`}>
        <main className="w-screen h-screen bg-cover bg-center pb-24 bg-white flex flex-col items-center">
          <Providers session={session}>
          <ThemeProvider>
          {children}
          </ThemeProvider>
          </Providers>
          </main></body>
    </html>
  );
}
