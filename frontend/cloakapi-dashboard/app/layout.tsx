import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CloakAPI Dashboard",
  description: "Admin dashboard for audit and masking events",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
