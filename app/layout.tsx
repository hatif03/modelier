import { Work_Sans, Fraunces } from "next/font/google";
import { SessionProvider } from "next-auth/react";

import "./globals.css";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

export const metadata = {
  title: "Modelier",
  description:
    "A VTO-native design canvas for small fashion and beauty brands",
};

const workSans = Work_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600"],
});

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-serif",
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const RootLayout = ({ children }: { children: React.ReactNode }) => (
  <html lang='en'>
    <body className={`${workSans.variable} ${fraunces.variable} font-sans bg-background text-foreground`}>
      <SessionProvider>
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster />
      </SessionProvider>
    </body>
  </html>
);

export default RootLayout;
