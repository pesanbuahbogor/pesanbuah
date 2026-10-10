import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import {
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Copy,
  Check,
  Search,
  Crosshair,
  Layers,
  Save,
  AlertCircle,
  Building,
  User,
} from 'lucide-react';
import { Prospect } from '../types';
import { db } from '../lib/db';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

interface CustomerLocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  prospect: Prospect | null;
  onLocationUpdated?: (updatedProspect: Prospect) => void;
}

export const CustomerLocationModal: React.FC<CustomerLocationModalProps> = ({
  isOpen,
  onClose,
  prospect,
  onLocationUpdated,
}) => {
  const { currentUser } = useAuth();
  const { success, error: toastError } = useToast();

  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [mapType, setMapType] = useState<'streets' | 'satellite'>('streets');
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [isDetectingCurrentGps, setIsDetectingCurrentGps] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [copiedCoords, setCopiedCoords] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  // Initialize or update coordinates when prospect changes
  useEffect(() => {
    if (prospect) {
      if (prospect.latitude != null && prospect.longitude != null) {
        setLat(prospect.latitude);
        setLng(prospect.longitude);
      } else {
        setLat(null);
        setLng(null);
      }
    }
  }, [prospect, isOpen]);

  // Leaflet Map Initialization
  useEffect(() => {
    if (!isOpen || !mapContainerRef.current) return;

    // Default center: prospect coords or Bogor center (-6.5971, 106.8060)
    const initialCenter: [number, number] =
      lat != null && lng != null ? [lat, lng] : [-6.5971, 106.8060];
    const initialZoom = lat != null && lng != null ? 17 : 13;

    // Clean up existing map instance
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true,
      scrollWheelZoom: true,
    });

    // Custom Icon for Leaflet
    const pinIcon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const streetLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const satelliteLayerUrl =
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const tileLayer = L.tileLayer(
      mapType === 'satellite' ? satelliteLayerUrl : streetLayerUrl,
      {
        attribution:
          mapType === 'satellite'
            ? 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            : '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(map);

    tileLayerRef.current = tileLayer;

    // If coordinates exist, add marker
    if (lat != null && lng != null) {
      const marker = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      marker.bindPopup(
        `<b>${prospect?.business_name || 'Lokasi Customer'}</b><br/>${prospect?.address || ''}<br/><span style="font-size:10px; color:#059669; font-weight:bold;">Geser pin untuk sesuaikan titik</span>`
      ).openPopup();

      marker.on('dragend', () => {
        const position = marker.getLatLng();
        setLat(Number(position.lat.toFixed(6)));
        setLng(Number(position.lng.toFixed(6)));
      });

      markerRef.current = marker;
    }

    // Allow user to click anywhere on map to move or place marker
    map.on('click', (e: L.LeafletMouseEvent) => {
      const clickedLat = Number(e.latlng.lat.toFixed(6));
      const clickedLng = Number(e.latlng.lng.toFixed(6));
      setLat(clickedLat);
      setLng(clickedLng);

      if (markerRef.current) {
        markerRef.current.setLatLng(e.latlng);
      } else {
        const newMarker = L.marker(e.latlng, { icon: pinIcon, draggable: true }).addTo(map);
        newMarker.bindPopup(
          `<b>${prospect?.business_name || 'Lokasi Customer'}</b><br/>${prospect?.address || ''}<br/><span style="font-size:10px; color:#059669; font-weight:bold;">Geser pin untuk sesuaikan titik</span>`
        ).openPopup();

        newMarker.on('dragend', () => {
          const position = newMarker.getLatLng();
          setLat(Number(position.lat.toFixed(6)));
          setLng(Number(position.lng.toFixed(6)));
        });

        markerRef.current = newMarker;
      }
    });

    mapInstanceRef.current = map;

    // Leaflet in modal fix: Invalidate size after modal animation finishes!
    const timer = setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [isOpen, mapType]);

  // Switch Tile Layer between Street and Satellite
  const handleToggleMapType = (type: 'streets' | 'satellite') => {
    setMapType(type);
    if (!mapInstanceRef.current) return;

    if (tileLayerRef.current) {
      mapInstanceRef.current.removeLayer(tileLayerRef.current);
    }

    const streetLayerUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
    const satelliteLayerUrl =
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';

    const newLayer = L.tileLayer(
      type === 'satellite' ? satelliteLayerUrl : streetLayerUrl,
      {
        attribution:
          type === 'satellite'
            ? 'Tiles &copy; Esri'
            : '&copy; OpenStreetMap contributors',
        maxZoom: 19,
      }
    ).addTo(mapInstanceRef.current);

    tileLayerRef.current = newLayer;
  };

  // Search Address via OpenStreetMap Nominatim
  const handleSearchFromAddress = async () => {
    if (!prospect?.address && !prospect?.business_name) {
      toastError('Alamat customer masih kosong.');
      return;
    }

    const query = `${prospect.address || ''} ${prospect.business_name || ''} Bogor Indonesia`.trim();
    setIsSearchingAddress(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`,
        { headers: { 'Accept-Language': 'id' } }
      );
      const data = await res.json();

      if (data && data.length > 0) {
        const foundLat = Number(parseFloat(data[0].lat).toFixed(6));
        const foundLng = Number(parseFloat(data[0].lon).toFixed(6));

        setLat(foundLat);
        setLng(foundLng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([foundLat, foundLng], 17);

          if (markerRef.current) {
            markerRef.current.setLatLng([foundLat, foundLng]);
          } else {
            const pinIcon = L.icon({
              iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
              iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
              shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
              iconSize: [25, 41],
              iconAnchor: [12, 41],
              popupAnchor: [1, -34],
              shadowSize: [41, 41],
            });

            const newMarker = L.marker([foundLat, foundLng], {
              icon: pinIcon,
              draggable: true,
            }).addTo(mapInstanceRef.current);

            newMarker.bindPopup(`<b>${prospect.business_name}</b><br/>${data[0].display_name}`).openPopup();
            markerRef.current = newMarker;
          }
        }
        success(`Titik lokasi ditemukan berdasarkan alamat: ${data[0].display_name.slice(0, 50)}...`);
      } else {
        toastError('Lokasi persis tidak ditemukan dari alamat. Silakan klik langsung pada peta untuk menandai titik.');
      }
    } catch {
      toastError('Koneksi pencarian alamat sedang sibuk. Silakan klik langsung pada peta untuk menandai titik.');
    } finally {
      setIsSearchingAddress(false);
    }
  };

  // Detect Current GPS of the device
  const handleDetectDeviceGps = () => {
    if (!navigator.geolocation) {
      toastError('Perangkat ini tidak mendukung deteksi GPS.');
      return;
    }

    setIsDetectingCurrentGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const currentLat = Number(pos.coords.latitude.toFixed(6));
        const currentLng = Number(pos.coords.longitude.toFixed(6));
        setLat(currentLat);
        setLng(currentLng);

        if (mapInstanceRef.current) {
          mapInstanceRef.current.setView([currentLat, currentLng], 18);
          if (markerRef.current) {
            markerRef.current.setLatLng([currentLat, currentLng]);
          }
        }
        setIsDetectingCurrentGps(false);
        success('Titik GPS berhasil disetel ke posisi Anda saat ini!');
      },
      (err) => {
        setIsDetectingCurrentGps(false);
        toastError(`Gagal mengambil GPS: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  // Save GPS Coordinates to Prospect
  const handleSaveGpsToProspect = async () => {
    if (!prospect) return;
    if (lat == null || lng == null) {
      toastError('Belum ada titik GPS yang dipilih pada peta.');
      return;
    }
    if (!currentUser) return;

    setIsSaving(true);
    try {
      const updated = await db.updateProspect(
        prospect.id,
        {
          latitude: lat,
          longitude: lng,
          gps_captured_at: new Date().toISOString(),
        },
        currentUser
      );

      success(`Titik GPS untuk "${prospect.business_name}" berhasil disimpan!`);
      if (onLocationUpdated) {
        onLocationUpdated(updated);
      }
      onClose();
    } catch (err: any) {
      toastError(err.message || 'Gagal menyimpan titik GPS ke customer.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCopyCoordinates = () => {
    if (lat == null || lng == null) return;
    navigator.clipboard.writeText(`${lat}, ${lng}`);
    setCopiedCoords(true);
    success('Koordinat latitude & longitude berhasil disalin!');
    setTimeout(() => setCopiedCoords(false), 2000);
  };

  if (!isOpen || !prospect) return null;

  const hasCoords = lat != null && lng != null;
  const googleMapsRouteUrl = hasCoords
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(prospect.address || '')}`;
  const wazeUrl = hasCoords ? `https://waze.com/ul?ll=${lat},${lng}&navigate=yes` : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[95vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-b border-gray-100 flex items-center justify-between bg-emerald-800 text-white">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="p-2 bg-white/15 rounded-xl shrink-0">
              <Navigation className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm sm:text-base leading-tight truncate">
                Analisa Titik &amp; Peta GPS Customer
              </h3>
              <p className="text-xs text-emerald-200 truncate">
                {prospect.business_name} &bull; PIC: {prospect.pic_name}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info & Tool Bar */}
        <div className="p-3 sm:p-4 bg-gray-50/90 border-b border-gray-200 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="min-w-0 flex items-start gap-2">
              <Building className="w-4 h-4 text-gray-500 mt-0.5 shrink-0" />
              <div className="min-w-0">
                <p className="text-xs text-gray-800 font-semibold line-clamp-1">
                  {prospect.address || 'Alamat belum diisi'}
                </p>
                <div className="flex items-center gap-2 text-[11px] text-gray-500 mt-0.5 flex-wrap">
                  <span className="flex items-center gap-1">
                    <User className="w-3 h-3 text-gray-400" /> PIC: {prospect.pic_name} ({prospect.phone})
                  </span>
                  {hasCoords ? (
                    <span className="font-mono text-emerald-800 font-bold bg-emerald-100/70 px-1.5 py-0.2 rounded">
                      Lat: {lat}, Lng: {lng}
                    </span>
                  ) : (
                    <span className="text-amber-800 font-semibold bg-amber-100/70 px-1.5 py-0.2 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3 text-amber-700" /> Belum ada titik koordinat
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Action Tools */}
            <div className="flex items-center gap-1.5 flex-wrap shrink-0">
              <button
                type="button"
                onClick={handleSearchFromAddress}
                disabled={isSearchingAddress}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-emerald-50 text-emerald-800 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Cari lokasi berdasarkan teks alamat"
              >
                <Search className={`w-3.5 h-3.5 text-emerald-600 ${isSearchingAddress ? 'animate-spin' : ''}`} />
                <span>{isSearchingAddress ? 'Mencari...' : 'Cari dari Alamat'}</span>
              </button>

              <button
                type="button"
                onClick={handleDetectDeviceGps}
                disabled={isDetectingCurrentGps}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white border border-gray-200 hover:bg-blue-50 text-blue-800 text-xs font-bold rounded-xl shadow-2xs transition cursor-pointer disabled:opacity-50"
                title="Gunakan posisi GPS perangkat saat ini"
              >
                <Crosshair className={`w-3.5 h-3.5 text-blue-600 ${isDetectingCurrentGps ? 'animate-spin' : ''}`} />
                <span>{isDetectingCurrentGps ? 'Mendeteksi...' : 'GPS Saya'}</span>
              </button>

              {/* Map Layer Switcher: Street vs Satellite */}
              <div className="inline-flex rounded-xl bg-white border border-gray-200 p-0.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleToggleMapType('streets')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer ${
                    mapType === 'streets' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Jalanan
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleMapType('satellite')}
                  className={`px-2 py-1 text-[11px] font-bold rounded-lg transition cursor-pointer flex items-center gap-1 ${
                    mapType === 'satellite' ? 'bg-emerald-700 text-white shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Layers className="w-3 h-3" />
                  Satelit
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Interactive Map Area */}
        <div className="relative flex-1 min-h-[380px] sm:min-h-[460px] bg-gray-100">
          <div ref={mapContainerRef} className="w-full h-full min-h-[380px] sm:min-h-[460px] z-0" />

          {/* Map Overlay Badge & Hint */}
          <div className="absolute top-3 left-3 z-10 bg-white/95 backdrop-blur-md px-3 py-1.5 rounded-xl border border-gray-200 shadow-md text-xs pointer-events-none max-w-xs">
            <div className="font-bold text-gray-900 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              <span>Petunjuk Analisa:</span>
            </div>
            <p className="text-[11px] text-gray-600 mt-0.5">
              Klik di peta atau geser pin merah untuk menandai toko/gang/rumah customer sebelum armada berangkat.
            </p>
          </div>

          {/* Quick Copy Coordinates Overlay */}
          {hasCoords && (
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-1.5 bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-lg border border-gray-200 shadow-xs text-xs font-mono">
              <span className="text-gray-700 font-semibold">
                {lat}, {lng}
              </span>
              <button
                type="button"
                onClick={handleCopyCoordinates}
                className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-800 transition cursor-pointer"
                title="Salin Koordinat"
              >
                {copiedCoords ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 border-t border-gray-200 bg-white flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Navigation Links */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={googleMapsRouteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
              <span>Buka Google Maps</span>
            </a>

            {wazeUrl && (
              <a
                href={wazeUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-300 rounded-xl text-xs font-bold transition shadow-2xs"
              >
                <Navigation className="w-3.5 h-3.5 text-blue-600" />
                <span>Buka di Waze</span>
              </a>
            )}
          </div>

          {/* Save & Close Buttons */}
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-xl transition cursor-pointer"
            >
              Tutup
            </button>

            <button
              type="button"
              onClick={handleSaveGpsToProspect}
              disabled={isSaving || !hasCoords}
              className="inline-flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Titik GPS Customer'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
