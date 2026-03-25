import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import SidebarWrapper from "@/components/sidebar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
        <body
          className={clsx(
            "min-h-screen bg-background font-sans antialiased",
            fontSans.variable
          )}
        >
          <div className="flex h-full bg-white dark:bg-black min-h-screen">
            {/* Sidebar */}
            <aside className="w-1/5 border-r border-r-slate-800 text-white p-4">
              <div className="sticky top-0">
                <SidebarWrapper />
              </div>
            </aside>

            {/* Main content area */}
            <main className="w-4/5">
              <div className="overflow-auto">{children}</div>
            </main>
          </div>
        </body>
      </Providers>
    </html>
  );
}
