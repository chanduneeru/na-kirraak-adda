"use client";

import React, { useEffect, useRef, useState } from "react";

interface LocationPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAddress: (data: {
    address: string;
    lat: number;
    lng: number;
    distanceKm: number;
    inZone: boolean;
    deliveryFee: number;
  }) => void;
}

export default function LocationPickerModal({
  isOpen,
  onClose,
  onSelectAddress,
}: LocationPickerModalProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number }>({
    lat: 17.3998,
    lng: 78.5630, // Uppal, Hyderabad default store location
  });
  const [addressText, setAddressText] = useState<string>("Locating your address...");
  const [isLoadingAddress, setIsLoadingAddress] = useState<boolean>(false);
  const [isGpsLoading, setIsGpsLoading] = useState<boolean>(false);

  // Delivery Zone Validation State
  const [zoneData, setZoneData] = useState<{
    inZone: boolean;
    distanceKm: number;
    deliveryFee: number;
    message: string;
  }>({
    inZone: true,
    distanceKm: 0,
    deliveryFee: 0,
    message: "Calculating distance from Uppal store...",
  });

  const mapInstanceRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  // Load Leaflet CDN script & CSS dynamically
  useEffect(() => {
    if (!isOpen) return;

    if (!document.getElementById("leaflet-css")) {
      const link = document.createElement("link");
      link.id = "leaflet-css";
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
      document.head.appendChild(link);
    }

    const loadLeaflet = () => {
      if ((window as any).L) {
        initMap();
        return;
      }

      if (!document.getElementById("leaflet-js")) {
        const script = document.createElement("script");
        script.id = "leaflet-js";
        script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
        script.onload = () => initMap();
        document.body.appendChild(script);
      } else {
        const checkL = setInterval(() => {
          if ((window as any).L) {
            clearInterval(checkL);
            initMap();
          }
        }, 100);
      }
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen]);

  const initMap = () => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
    }

    const defaultLat = selectedCoords.lat;
    const defaultLng = selectedCoords.lng;

    const map = L.map(mapContainerRef.current, {
      center: [defaultLat, defaultLng],
      zoom: 16,
      zoomControl: true,
    });

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const pinIcon = L.divIcon({
      className: "custom-leaflet-pin",
      html: `<div style="font-size:32px; filter:drop-shadow(0 4px 6px rgba(0,0,0,0.5)); cursor:grab;">📍</div>`,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    const marker = L.marker([defaultLat, defaultLng], {
      draggable: true,
      icon: pinIcon,
    }).addTo(map);

    mapInstanceRef.current = map;
    markerRef.current = marker;

    // Fetch initial geocoded address & validate distance
    reverseGeocode(defaultLat, defaultLng);

    // Listen to marker dragend
    marker.on("dragend", (e: any) => {
      const position = e.target.getLatLng();
      setSelectedCoords({ lat: position.lat, lng: position.lng });
      reverseGeocode(position.lat, position.lng);
    });

    // Listen to map click
    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      setSelectedCoords({ lat, lng });
      reverseGeocode(lat, lng);
    });

    // Try auto-detecting customer GPS on load
    detectCurrentGPS(map, marker);
  };

  const detectCurrentGPS = (mapInstance?: any, markerInstance?: any) => {
    if ("geolocation" in navigator) {
      setIsGpsLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setSelectedCoords({ lat: latitude, lng: longitude });

          const map = mapInstance || mapInstanceRef.current;
          const marker = markerInstance || markerRef.current;

          if (map && marker) {
            map.setView([latitude, longitude], 17);
            marker.setLatLng([latitude, longitude]);
          }

          reverseGeocode(latitude, longitude);
          setIsGpsLoading(false);
        },
        () => {
          setIsGpsLoading(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    }
  };

  const reverseGeocode = async (lat: number, lng: number) => {
    setIsLoadingAddress(true);
    try {
      // 1. Fetch Reverse Geocoded Address
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`
      );
      const data = await res.json();
      if (data && data.display_name) {
        const addr = data.address || {};
        const houseOrBuilding = addr.building || addr.house_number || addr.amenity || "";
        const road = addr.road || addr.street || addr.pedestrian || "";
        const suburb = addr.suburb || addr.neighbourhood || addr.residential || addr.village || "";
        const city = addr.city || addr.town || addr.county || "Hyderabad";
        const postcode = addr.postcode ? ` - ${addr.postcode}` : "";

        const formatted = [houseOrBuilding, road, suburb, city].filter(Boolean).join(", ");
        setAddressText(formatted ? `${formatted}${postcode}` : data.display_name);
      } else {
        setAddressText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)} (Uppal Area)`);
      }

      // 2. Validate Delivery Radius Distance against Store (Lat: 17.3998, Lng: 78.5630)
      const valRes = await fetch("/api/delivery/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ lat, lng }),
      });
      const valData = await valRes.json();
      setZoneData({
        inZone: Boolean(valData.inZone),
        distanceKm: valData.distance || 0,
        deliveryFee: valData.deliveryFee || 0,
        message: valData.message || (valData.inZone ? "Delivery available!" : "Location out of delivery radius"),
      });
    } catch (e) {
      setAddressText(`Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`);
    } finally {
      setIsLoadingAddress(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3.5 sm:p-4 animate-in fade-in zoom-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-4 sm:p-5 space-y-3.5 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">🗺️</span>
            <div>
              <h3 className="font-extrabold text-base text-amber-400">Pin House Location</h3>
              <p className="text-[11px] text-slate-400">Drag map pin to your exact building or house door</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white font-bold text-xl px-2 py-1">
            ✕
          </button>
        </div>

        {/* Live GPS Locate Action Button */}
        <div className="flex items-center justify-between bg-slate-950 px-3 py-2 rounded-xl border border-slate-800 text-xs">
          <span className="text-slate-300 text-[11px] font-medium">Auto-center on phone GPS location:</span>
          <button
            type="button"
            onClick={() => detectCurrentGPS()}
            disabled={isGpsLoading}
            className="bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 text-amber-300 px-3 py-1 rounded-lg text-[11px] font-extrabold transition flex items-center gap-1 shadow-sm"
          >
            <span>🎯</span>
            <span>{isGpsLoading ? "Locating..." : "Locate Me"}</span>
          </button>
        </div>

        {/* Interactive Leaflet Map Container */}
        <div className="relative w-full h-64 sm:h-72 rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
          <div ref={mapContainerRef} className="w-full h-full z-10" />
        </div>

        {/* Selected Address Preview Box */}
        <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-[10px] uppercase font-bold text-slate-400">
            <span>📍 Selected Address:</span>
            {isLoadingAddress && <span className="text-amber-400 animate-pulse">Checking distance...</span>}
          </div>
          <p className="text-amber-300 font-medium text-xs sm:text-sm line-clamp-2 leading-relaxed">
            {addressText}
          </p>

          {/* Delivery Zone Radius Status Badge */}
          <div className="pt-1.5 border-t border-slate-800/80">
            {zoneData.inZone ? (
              <div className="flex items-center justify-between text-emerald-400 text-[11px] font-bold">
                <span>✓ Delivery Available ({zoneData.distanceKm} km from Uppal store)</span>
                <span className="bg-emerald-500/20 px-2 py-0.5 rounded text-[10px]">
                  {zoneData.deliveryFee === 0 ? "FREE Delivery" : `Fee: ₹${zoneData.deliveryFee}`}
                </span>
              </div>
            ) : (
              <div className="text-red-400 text-[11px] font-extrabold flex items-center gap-1">
                <span>⚠️</span>
                <span>Out of Delivery Radius ({zoneData.distanceKm} km away from Uppal store)</span>
              </div>
            )}
          </div>
        </div>

        {/* Confirm Action Button */}
        <button
          type="button"
          disabled={!zoneData.inZone || isLoadingAddress}
          onClick={() => {
            if (addressText && zoneData.inZone) {
              onSelectAddress({
                address: addressText,
                lat: selectedCoords.lat,
                lng: selectedCoords.lng,
                distanceKm: zoneData.distanceKm,
                inZone: zoneData.inZone,
                deliveryFee: zoneData.deliveryFee,
              });
              onClose();
            }
          }}
          className={`w-full font-black py-3 rounded-2xl text-xs sm:text-sm shadow-xl transition flex items-center justify-center gap-2 ${
            zoneData.inZone
              ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950"
              : "bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700"
          }`}
        >
          {zoneData.inZone
            ? "Confirm & Auto-Fill Address ✓"
            : `Location Out of Delivery Zone (${zoneData.distanceKm} km)`}
        </button>
      </div>
    </div>
  );
}
