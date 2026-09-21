import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Geist, Geist_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { Providers } from "@/components/providers";
import { LocaleProvider } from "@/components/i18n/locale-provider";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale } from "@/lib/i18n/config";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const manrope = Manrope({
  variable: "--font-heading-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "ThreadTrack — Attendance for Textile Teams",
  description:
    "Mark and manage daily worker attendance by department for textile, embroidery and garment units.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f9f9f7" },
    { media: "(prefers-color-scheme: dark)", color: "#0d0d0d" },
  ],
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // This is the app-wide default — anonymous pages (login/signup/join) render
  // in whatever language was last chosen via the cookie. The dashboard and
  // worker layouts each re-provide their own nested LocaleProvider using the
  // signed-in person's saved locale instead, which overrides this one for
  // everything inside them. Reading the cookie here (server-side, before any
  // HTML is sent) rather than in a client effect is what keeps the very
  // first render already in the right language instead of flashing English.
  const cookieStore = await cookies();
  const cookieLocale = cookieStore.get(LOCALE_COOKIE)?.value;
  const locale = isLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  return (
    <html
      lang={locale}
      data-scroll-behavior="smooth"
      className={`${geistSans.variable} ${geistMono.variable} ${manrope.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <Providers>
          <LocaleProvider locale={locale}>{children}</LocaleProvider>
        </Providers>
      </body>
    </html>
  );
}
