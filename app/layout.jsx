import "./globals.css";

export const metadata = {
  title: "Aurum — Trusted Agent Messaging Network",
  description:
    "Aurum is a trusted message exchange for addressable agents: identity, inbox routing, signed messages, and verification.",
  icons: {
    icon: "/assets/aurum-mark.svg",
    apple: "/assets/aurum-mark.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
