import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "./components/Header";
import JsonLd from "./components/JsonLd";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: "#FF6B00",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  metadataBase: new URL("https://nakirraakadda.com"),
  title: "NA KIRRAAK ADDA — Best Cafe, Burgers & Pizza in Uppal, Hyderabad",
  description:
    "Top-rated Restaurant & Cafe in Uppal, Hyderabad. Order delicious smash burgers, double crust pizzas, cafe cold coffees, tea, milkshakes, sandwiches & biryani. Fast food delivery in Uppal, Ramanthapur, Nagole, Habsiguda & Boduppal.",
  keywords: [
    "NA KIRRAAK ADDA Uppal",
    "Best Burgers in Uppal Hyderabad",
    "Double Crust Pizza near me Uppal",
    "Food Delivery in Uppal & Nagole",
    "Best Cafe in Uppal Hyderabad",
    "Coffee Shop in Uppal",
    "Cold Coffee & Milkshakes Uppal",
    "Restaurant near Ramanthapur",
    "Fast Food Delivery Habsiguda Boduppal",
    "Cafe in Uppal for Friends & Couples",
    "Digital Dine In Menu Uppal",
    "Sandwiches & Momos Uppal",
    "Best Cafe near Tarnaka & Nacharam",
    "Kirrak Adda Hyderabad"
  ],
  authors: [{ name: "NA KIRRAAK ADDA" }],
  creator: "NA KIRRAAK ADDA",
  publisher: "NA KIRRAAK ADDA",
  formatDetection: {
    telephone: true,
    address: true,
    email: true,
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "NA KIRRAAK ADDA — Best Cafe, Burgers & Pizza in Uppal, Hyderabad",
    description:
      "Order juicy smash burgers, double crust pizzas, cafe coffee, tea, milkshakes & biryani online in Uppal, Hyderabad. Fast delivery & digital QR dine-in.",
    url: "https://nakirraakadda.com",
    siteName: "NA KIRRAAK ADDA",
    images: [
      {
        url: "/logo/brand-image.jpeg",
        width: 1200,
        height: 630,
        alt: "NA KIRRAAK ADDA Restaurant & Cafe Uppal",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "NA KIRRAAK ADDA — Best Cafe, Burgers & Pizza in Uppal",
    description:
      "Order delicious smash burgers, double crust pizzas, cold coffee & milkshakes online in Uppal, Hyderabad.",
    images: ["/logo/brand-image.jpeg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  other: {
    "geo.region": "IN-TG",
    "geo.placename": "Uppal, Hyderabad, Telangana",
    "geo.position": "17.3998;78.5630",
    "ICBM": "17.3998, 78.5630",
  },
  icons: {
    icon: "/logo/brand-image.jpeg",
    shortcut: "/logo/brand-image.jpeg",
    apple: "/logo/brand-image.jpeg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <JsonLd />
      </head>
      <body className="min-h-full flex flex-col bg-[#050505]">
        <Header />
        {children}
      </body>
    </html>
  );
}
