import "./globals.css";
import { getLang } from "@/lib/i18n/server";

export const metadata = {
  title: "Aurum — Trusted Agent Messaging Network",
  description:
    "Aurum is a trusted message exchange for addressable agents: identity, inbox routing, signed messages, and verification.",
  icons: {
    icon: "/assets/aurum-mark.svg",
    apple: "/assets/aurum-mark.svg",
  },
};

export default async function RootLayout({ children }) {
  const lang = await getLang();
  return (
    <html lang={lang === "zh" ? "zh-CN" : "en"}>
      <body>{children}</body>
    </html>
  );
}
