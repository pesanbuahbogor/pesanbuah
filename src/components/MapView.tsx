import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { MapPin, ExternalLink } from 'lucide-react';

interface MapViewProps {
  latitude: number | null;
  longitude: number | null;
  businessName?: string;
  address?: string;
  heightClass?: string;
  interactive?: boolean;
}

export const MapView: React.FC<MapViewProps> = ({
  latitude,
  longitude,
  businessName = 'Lokasi Usaha',
  address,
  heightClass = 'h-64',
  interactive = true,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);

  const hasCoords = latitude != null && longitude != null && !isNaN(latitude) && !isNaN(longitude);

  useEffect(() => {
    if (!hasCoords || !mapContainerRef.current) return;

    // Clean up previous map if exists
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Default icon fix for Leaflet in Vite
    const customIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const map = L.map(mapContainerRef.current, {
      center: [latitude!, longitude!],
      zoom: 16,
      zoomControl: interactive,
      dragging: interactive,
      scrollWheelZoom: interactive,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(map);

    const marker = L.marker([latitude!, longitude!], { icon: customIcon }).addTo(map);
    marker.bindPopup(`<b>${businessName}</b><br/>${address || ''}`).openPopup();

    mapInstanceRef.current = map;
    markerRef.current = marker;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [latitude, longitude, businessName, address, interactive, hasCoords]);

  if (!hasCoords) {
    return (
      <div className={`w-full ${heightClass} bg-gray-50 border border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center p-4 text-center text-gray-500`}>
        <MapPin className="w-8 h-8 text-gray-400 mb-2" />
        <p className="text-sm font-medium">Titik GPS Belum Diambil</p>
        <p className="text-xs text-gray-400 mt-1">Gunakan tombol "Ambil Lokasi GPS" pada form untuk menyimpan koordinat lokasi calon customer.</p>
      </div>
    );
  }

  const googleMapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;

  return (
    <div className="relative rounded-xl overflow-hidden border border-gray-200 shadow-xs">
      <div ref={mapContainerRef} className={`w-full ${heightClass} z-0`} />
      <div className="absolute top-2 right-2 z-10">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/95 hover:bg-white text-emerald-800 text-xs font-semibold rounded-lg shadow-md border border-emerald-100 backdrop-blur-xs transition"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Buka di Google Maps
        </a>
      </div>
      <div className="absolute bottom-2 left-2 z-10 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[11px] font-mono text-gray-700 shadow-xs border border-gray-200">
        Lat: {latitude?.toFixed(6)}, Lng: {longitude?.toFixed(6)}
      </div>
    </div>
  );
};
