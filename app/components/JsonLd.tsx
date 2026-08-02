import React from "react";

export default function JsonLd() {
  const restaurantSchema = {
    "@context": "https://schema.org",
    "@type": ["Restaurant", "CafeOrCoffeeShop", "FastFoodRestaurant"],
    "name": "NA KIRRAAK ADDA — Restaurant & Cafe",
    "alternateName": "NA KIRRAAK ADDA Uppal",
    "description": "Best Restaurant & Cafe in Uppal, Hyderabad. Serving juicy smash burgers, double crust pizzas, cafe coffees, tea, milkshakes, sandwiches, momos & biryani with online food delivery and digital dine-in.",
    "image": [
      "https://nakirraakadda.com/logo/brand-image.jpeg"
    ],
    "url": "https://nakirraakadda.com",
    "telephone": "+91-9966533466",
    "priceRange": "₹₹ (₹100 - ₹500)",
    "menu": "https://nakirraakadda.com/dine-in",
    "acceptsReservations": "True",
    "servesCuisine": [
      "Burgers",
      "Pizza",
      "Cafe",
      "Coffee & Tea",
      "Sandwiches",
      "Fast Food",
      "Biryani",
      "Snacks & Desserts"
    ],
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Uppal Main Road",
      "addressLocality": "Uppal",
      "addressRegion": "Telangana",
      "postalCode": "500039",
      "addressCountry": "IN"
    },
    "geo": {
      "@type": "GeoCoordinates",
      "latitude": 17.3998,
      "longitude": 78.5630
    },
    "openingHoursSpecification": [
      {
        "@type": "OpeningHoursSpecification",
        "dayOfWeek": [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday"
        ],
        "opens": "11:00",
        "closes": "23:00"
      }
    ],
    "paymentAccepted": "Cash, Credit Card, Debit Card, UPI, Paytm, GPay, PhonePe",
    "areaServed": [
      "Uppal",
      "Ramanthapur",
      "Nagole",
      "Habsiguda",
      "Boduppal",
      "Nacharam",
      "Tarnaka",
      "Chiluka Nagar",
      "Alkapuri X Roads",
      "Peerzadiguda",
      "Hyderabad"
    ]
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurantSchema) }}
    />
  );
}
