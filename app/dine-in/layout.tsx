import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Digital Dine-In Menu & Cafe | NA KIRRAAK ADDA Uppal",
  description:
    "Order food directly from your table at NA KIRRAAK ADDA Uppal. Scan QR code to view our digital menu of smash burgers, double crust pizzas, cafe coffees, tea, milkshakes & snacks.",
  keywords: [
    "Dine in Cafe Uppal",
    "Digital Menu QR Code Uppal",
    "NA KIRRAAK ADDA Dine In",
    "Best Cafe in Uppal Hyderabad",
    "Burgers and Pizza Dine In Uppal",
    "Restaurant Table Ordering Uppal"
  ],
  openGraph: {
    title: "Digital Dine-In Menu & Cafe | NA KIRRAAK ADDA Uppal",
    description: "Scan QR code to order burgers, pizzas, cafe coffee & milkshakes from your table at NA KIRRAAK ADDA Uppal.",
    url: "https://nakirraakadda.com/dine-in",
    siteName: "NA KIRRAAK ADDA",
    images: ["/logo/brand-image.jpeg"],
  },
};

export default function DineInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
