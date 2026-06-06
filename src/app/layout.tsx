import type { Metadata } from "next";
import { Syne, DM_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/ui/toast";

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-heading",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TaskFlow - Daily Task Planner",
  description: "A beautiful daily task planner with lists, labels, and smart views",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('theme');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  var isDark = theme === 'dark' || (!theme && prefersDark);
                  if (isDark) {
                    document.documentElement.classList.add('dark');
                  } else {
                    document.documentElement.classList.remove('dark');
                  }
                  var meta = document.querySelector('meta[name="theme-color"]');
                  if (!meta) {
                    meta = document.createElement('meta');
                    meta.name = 'theme-color';
                    document.head.appendChild(meta);
                  }
                  meta.content = isDark ? '#141415' : '#ffffff';
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`min-h-screen bg-background font-body antialiased ${syne.variable} ${dmSans.variable}`}>
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
