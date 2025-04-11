import type { Metadata } from "next";
import "./globals.css";
import { Navbar } from "@/components/Navbar";
import Footer from "@/components/Footer";
import UserProvider from "@/contexts/UserContext";
import IntializeUser from "@/components/InitalizeUser";

export const metadata: Metadata = {
  title: "ForReelFlies",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <UserProvider initialUser={null} loading={true}>
          <IntializeUser />
          <Navbar />
          {children}
          <Footer />
        </UserProvider>
      </body>
    </html>
  );
}
