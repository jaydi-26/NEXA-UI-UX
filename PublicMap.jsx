import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { ShieldCheck, Filter, Layers } from 'lucide-react';

// Sumber peta dasar (tanpa API key). Kalau yang pertama gagal dimuat, otomatis pindah ke berikutnya.
const TILE_PROVIDERS = [
  {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
  },
  {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri',
    maxZoom: 19,
  },
];

export default function PublicMap({ areas = [], reports = [], currentRole = 'PUBLIC', onSelectArea, onSelectReport, heightClass = 'h-[520px]' }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const polygonsLayerRef = useRef(null);

  const [filterType, setFilterType] = useState('ALL');
  const [focusRequest, setFocusRequest] = useState(0); // naik setiap kali filter ditekan
  const lastFocusRef = useRef(0);
  const [emptyNote, setEmptyNote] = useState(null);

  const FILTER_LABEL = { ALL: 'laporan', Clogged_Drain: 'saluran tersumbat', Trash: 'sampah', Flood: 'genangan' };

  // Tekan filter: tampilkan kategori itu dan antar peta ke lokasinya
  const selectFilter = (type) => {
    setFilterType(type);
    setFocusRequest(n => n + 1);
  };
  const [selectedItem, setSelectedItem] = useState(null);
  const [tilesFailed, setTilesFailed] = useState(false);

  // Initialize Map Once
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Centered around Jakarta Timur / Selatan (Ciliwung basin: Kampung Melayu, Bidara Cina, Tebet)
    const map = L.map(mapContainerRef.current, {
      center: [-6.2300, 106.8650],
      zoom: 14,
      zoomControl: false, // dipindah ke kanan bawah supaya tidak tertutup label di kiri atas
      scrollWheelZoom: false, // aktif setelah peta diklik agar tidak mengganggu scroll halaman
      maxBounds: [[-6.40, 106.65], [-6.05, 107.00]], // batas Jakarta
      maxBoundsViscosity: 0.8,
      minZoom: 11,
    });
    map.once('click', () => map.scrollWheelZoom.enable());
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Peta dasar OpenStreetMap, dengan cadangan otomatis kalau gagal dimuat
    let tileLayer = null;
    const mountTiles = (idx) => {
      if (tileLayer) map.removeLayer(tileLayer);
      const provider = TILE_PROVIDERS[idx];
      const layer = L.tileLayer(provider.url, { attribution: provider.attribution, maxZoom: provider.maxZoom });
      let loaded = 0;
      let errors = 0;
      layer.on('tileload', () => { loaded += 1; setTilesFailed(false); });
      layer.on('tileerror', () => {
        if (layer !== tileLayer) return;
        errors += 1;
        if (loaded === 0 && errors >= 3) {
          if (idx + 1 < TILE_PROVIDERS.length) mountTiles(idx + 1);
          else setTilesFailed(true);
        }
      });
      tileLayer = layer;
      layer.addTo(map);
      layer.bringToBack();
    };
    mountTiles(0);

    // Hitung ulang ukuran peta saat wadahnya berubah (mis. sidebar atau jendela), supaya tidak ada area kosong
    const resizeObserver = typeof ResizeObserver !== 'undefined'
      ? new ResizeObserver(() => map.invalidateSize())
      : null;
    resizeObserver?.observe(mapContainerRef.current);
    const sizeTimer = setTimeout(() => map.invalidateSize(), 250);

    markersLayerRef.current = L.layerGroup().addTo(map);
    polygonsLayerRef.current = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;

    return () => {
      clearTimeout(sizeTimer);
      resizeObserver?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers when areas, reports, or filter changes
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !polygonsLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    polygonsLayerRef.current.clearLayers();

    const isPublic = currentRole === 'PUBLIC' || currentRole === 'NGO';
    const visiblePoints = [];

    // 1. Render RT/RW Areas Boundaries
    areas.forEach(area => {
      if (area.geom_polygon && area.geom_polygon.length > 0) {
        const polygon = L.polygon(area.geom_polygon, {
          color: '#0284c7',
          weight: 2,
          opacity: 0.8,
          fillColor: '#38bdf8',
          fillOpacity: 0.12,
          dashArray: '4, 4'
        }).addTo(polygonsLayerRef.current);

        polygon.bindTooltip(
          `<strong>${area.kelurahan}</strong><br/>${area.rt_code} ${area.rw_code}<br/><span style="font-size:11px;color:#0284c7;">Pusat Wilayah RT Agregat</span>`,
          { sticky: true }
        );
      }
    });

    // 2. Render Markers
    if (isPublic) {
      // Sesuai UU PDP: Render ONLY RT Aggregated Center points
      areas.forEach(area => {
        const areaReports = reports.filter(r => r.rt_rw_id === area.id);
        const filtered = filterType === 'ALL' 
          ? areaReports 
          : areaReports.filter(r => r.hazard_type === filterType);

        if (filtered.length === 0 && filterType !== 'ALL') return;

        const count = filtered.length;
        const hasFlood = filtered.some(r => r.hazard_type === 'Flood');
        const hasClogged = filtered.some(r => r.hazard_type === 'Clogged_Drain');

        let bgColor = '#0284c7';
        if (hasFlood) bgColor = '#ef4444';
        else if (hasClogged) bgColor = '#f59e0b';

        // Custom HTML marker badge
        const icon = L.divIcon({
          className: 'custom-rt-marker',
          html: `
            <div style="
              background: ${bgColor};
              color: white;
              width: 36px;
              height: 36px;
              border-radius: 50%;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: 800;
              font-size: 13px;
              border: 3px solid rgba(255,255,255,0.9);
              box-shadow: 0 4px 14px rgba(30,64,175,0.35);
              cursor: pointer;
            ">
              ${count > 0 ? count : 'RT'}
            </div>
          `,
          iconSize: [36, 36],
          iconAnchor: [18, 18],
        });

        const marker = L.marker([area.geom_center.lat, area.geom_center.lng], { icon })
          .addTo(markersLayerRef.current);
        visiblePoints.push([area.geom_center.lat, area.geom_center.lng]);

        marker.on('click', () => {
          setSelectedItem({
            type: 'AREA_AGGREGATE',
            area,
            reports: filtered
          });
          if (onSelectArea) onSelectArea(area);
        });
      });
    } else {
      // VERIFIED RT LEADER VIEW: Exact GPS locations visible
      reports.forEach(report => {
        if (filterType !== 'ALL' && report.hazard_type !== filterType) return;

        const loc = report.exact_location || { lat: -6.2285, lng: 106.8650 };
        let iconColor = '#0284c7';
        let symbol = '';

        if (report.hazard_type === 'Clogged_Drain') {
          iconColor = '#f59e0b';
        } else if (report.hazard_type === 'Trash') {
          iconColor = '#8b5cf6';
        } else if (report.hazard_type === 'Flood') {
          iconColor = '#ef4444';
        }

        const icon = L.divIcon({
          className: 'verified-exact-marker',
          html: `
            <div style="
              background: ${iconColor};
              color: white;
              padding: 4px 8px;
              border-radius: 9999px;
              font-weight: 700;
              font-size: 11px;
              display: flex;
              align-items: center;
              gap: 4px;
              border: 2px solid white;
              box-shadow: 0 4px 12px rgba(0,0,0,0.35);
              white-space: nowrap;
            ">
              <span>${report.hazard_type_label || report.hazard_type}</span>
            </div>
          `,
          iconSize: [120, 30],
          iconAnchor: [60, 15]
        });

        const marker = L.marker([loc.lat, loc.lng], { icon })
          .addTo(markersLayerRef.current);
        visiblePoints.push([loc.lat, loc.lng]);

        marker.on('click', () => {
          setSelectedItem({
            type: 'REPORT_EXACT',
            report
          });
          if (onSelectReport) onSelectReport(report);
        });
      });
    }

    // Antar peta ke lokasi hanya saat filter ditekan, bukan setiap data diperbarui otomatis
    if (focusRequest !== lastFocusRef.current) {
      lastFocusRef.current = focusRequest;
      const map = mapInstanceRef.current;
      if (visiblePoints.length === 0) {
        setEmptyNote(`Belum ada laporan ${FILTER_LABEL[filterType] || ''}`.trim());
        setTimeout(() => setEmptyNote(null), 3500);
      } else {
        setEmptyNote(null);
        if (visiblePoints.length === 1) {
          map.flyTo(visiblePoints[0], 16, { duration: 0.8 });
        } else {
          map.flyToBounds(L.latLngBounds(visiblePoints).pad(0.35), { maxZoom: 16, duration: 0.8 });
        }
      }
    }
  }, [areas, reports, currentRole, filterType, focusRequest]);

  return (
    <div className={`relative w-full ${heightClass} rounded-2xl overflow-hidden border border-blue-200 shadow-lg bg-white`}>
      {/* Map container */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {tilesFailed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-10 max-w-sm bg-amber-50 border border-amber-300 rounded-xl px-4 py-2.5 text-xs text-amber-800 shadow-lg text-center">
          <strong className="block text-amber-900">Gambar peta belum bisa dimuat</strong>
          Cek koneksi internet, lalu muat ulang halaman.
        </div>
      )}

      {/* Legenda risiko */}
      <div className="absolute bottom-4 left-4 z-10 bg-white/95 border border-blue-200 rounded-xl px-3 py-2 text-[11px] text-blue-900 space-y-1 shadow-lg">
        <div className="font-bold text-blue-950">Legenda</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:'#ef4444'}} /> Ada laporan banjir</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:'#f59e0b'}} /> Saluran tersumbat</div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{background:'#0284c7'}} /> Pusat RT / belum ada laporan</div>
      </div>

      {/* Top Overlay: PDP Privacy Badge & Filters */}
      <div className="absolute top-4 left-4 z-10 flex flex-wrap items-center gap-2">
        {currentRole === 'PUBLIC' || currentRole === 'NGO' ? (
          <div className="bg-white/95 px-3 py-1.5 rounded-xl border border-blue-200 text-xs shadow-lg flex items-center gap-2 text-blue-800">
            <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-950">Peta publik:</span>{' '}
              <span className="text-blue-800">lokasi rumah disamarkan.</span>
            </div>
          </div>
        ) : (
          <div className="bg-white/95 px-3 py-1.5 rounded-xl border border-emerald-200 text-xs shadow-lg flex items-center gap-2 text-emerald-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-blue-950">Mode Ketua RT:</span>{' '}
              <span className="text-emerald-700">lokasi presisi ditampilkan.</span>
            </div>
          </div>
        )}
      </div>

      {emptyNote && (
        <div className="absolute top-16 right-4 z-10 bg-white/95 border border-blue-200 rounded-lg px-3 py-1.5 text-xs font-semibold text-blue-800 shadow-lg">
          {emptyNote}
        </div>
      )}

      {/* Filter Chips Overlay */}
      <div className="absolute top-4 right-4 z-10 bg-white/90 p-1 rounded-xl border border-blue-200 shadow-lg flex items-center gap-1 text-xs">
        <button
          onClick={() => selectFilter('ALL')}
          className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
            filterType === 'ALL' ? 'bg-blue-600 text-white shadow' : 'text-blue-800 hover:text-blue-950'
          }`}
        >
          Semua
        </button>
        <button
          onClick={() => selectFilter('Clogged_Drain')}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
            filterType === 'Clogged_Drain' ? 'bg-amber-500 text-blue-950 font-bold shadow' : 'text-blue-800 hover:text-blue-950'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-400"></span>
          Saluran
        </button>
        <button
          onClick={() => selectFilter('Trash')}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
            filterType === 'Trash' ? 'bg-purple-600 text-white shadow' : 'text-blue-800 hover:text-blue-950'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-purple-300"></span>
          Sampah
        </button>
        <button
          onClick={() => selectFilter('Flood')}
          className={`px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 transition-all ${
            filterType === 'Flood' ? 'bg-rose-600 text-white shadow' : 'text-blue-800 hover:text-blue-950'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-300"></span>
          Genangan
        </button>
      </div>

      {/* Bottom Floating Legend / Selected Item Card */}
      {selectedItem && (
        <div className="absolute bottom-4 left-4 right-4 z-10 bg-white/95 p-4 rounded-xl border border-blue-200 shadow-lg animate-fade-in max-w-lg">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-700 border border-blue-200">
                  {selectedItem.type === 'AREA_AGGREGATE' ? 'Data Agregat Wilayah' : 'Detail Laporan Presisi'}
                </span>
                <span className="text-xs text-blue-600">
                  {selectedItem.type === 'AREA_AGGREGATE' ? selectedItem.area.kota : selectedItem.report.kelurahan}
                </span>
              </div>

              <h4 className="text-base font-bold text-blue-950 mt-1">
                {selectedItem.type === 'AREA_AGGREGATE'
                  ? `${selectedItem.area.kelurahan} (${selectedItem.area.rt_code} ${selectedItem.area.rw_code})`
                  : selectedItem.report.hazard_type_label}
              </h4>
            </div>

            <button
              onClick={() => setSelectedItem(null)}
              className="text-blue-600 hover:text-blue-950 text-xs px-2 py-1 rounded bg-blue-50"
            >
              Tutup
            </button>
          </div>

          {selectedItem.type === 'AREA_AGGREGATE' ? (
            <div className="mt-3 text-xs text-blue-800 space-y-1.5">
              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                <span>Laporan di RT ini:</span>
                <strong className="text-blue-700 text-sm">{selectedItem.reports.length} laporan</strong>
              </div>
              <div className="flex items-center justify-between text-blue-600">
                <span>Pos Pantau Terkait:</span>
                <span className="text-blue-900">{selectedItem.area.monitoring_post}</span>
              </div>
              <div className="flex items-center justify-between text-blue-600">
                <span>Resapan air:</span>
                <span className="text-amber-700">{selectedItem.area.water_retention_capacity}</span>
              </div>
              <p className="text-[11px] text-blue-600 italic mt-2 border-t border-blue-100 pt-2">
                Lokasi rumah warga tidak ditampilkan.
              </p>
            </div>
          ) : (
            <div className="mt-3 text-xs text-blue-800 space-y-1.5">
              <p className="text-blue-900">{selectedItem.report.description}</p>
              <div className="flex items-center justify-between bg-blue-50 p-2 rounded-lg">
                <span className="text-blue-600">Alamat Presisi:</span>
                <span className="font-semibold text-emerald-600">{selectedItem.report.exact_location?.address}</span>
              </div>
              <div className="flex items-center justify-between text-blue-600">
                <span>Pelapor:</span>
                <span className="text-blue-900">{selectedItem.report.reporter_name} ({selectedItem.report.reporter_phone})</span>
              </div>
              <div className="flex items-center justify-between text-blue-600">
                <span>AI Rekomendasi:</span>
                <span className="text-amber-700 font-medium">{selectedItem.report.ai_suggested_severity}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
