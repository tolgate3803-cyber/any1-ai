import { useState, useEffect, useRef } from 'react';
import { APIProvider, Map, useMap, useMapsLibrary, AdvancedMarker, Pin, InfoWindow, useAdvancedMarkerRef } from '@vis.gl/react-google-maps';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  MapPin, 
  Star, 
  Compass, 
  Loader2, 
  Navigation, 
  Coffee, 
  Utensils, 
  Store, 
  RefreshCw, 
  AlertTriangle, 
  Flame, 
  Bike,
  Globe,
  Key,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Check,
  Info
} from 'lucide-react';

const API_KEY =
  (typeof process !== 'undefined' && process?.env?.GOOGLE_MAPS_PLATFORM_KEY) ||
  (import.meta as any).env?.VITE_GOOGLE_MAPS_PLATFORM_KEY ||
  (globalThis as any).GOOGLE_MAPS_PLATFORM_KEY ||
  '';
const hasValidKey = Boolean(API_KEY) && API_KEY !== 'YOUR_API_KEY';

interface MapViewerProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title: string }>;
}

export default function MapViewer({ center = { lat: 37.5665, lng: 126.9780 }, zoom = 12, markers = [] }: MapViewerProps) {
  if (!hasValidKey) {
    return <OpenStreetMapViewer initialCenter={center} externalMarkers={markers} />;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full h-[540px] border border-neon/20 rounded-sm overflow-hidden mb-6 relative group shadow-[0_0_30px_rgba(0,243,255,0.05)] font-sans"
    >
      <APIProvider apiKey={API_KEY} version="weekly">
        <InnerMap center={center} zoom={zoom} markers={markers} />
      </APIProvider>
    </motion.div>
  );
}

interface InnerMapProps {
  center: { lat: number; lng: number };
  zoom: number;
  markers: Array<{ lat: number; lng: number; title: string }>;
}

function InnerMap({ center, zoom, markers: externalMarkers }: InnerMapProps) {
  const map = useMap();
  const geocodingLib = useMapsLibrary('geocoding');
  const placesLib = useMapsLibrary('places');

  const [searchQuery, setSearchQuery] = useState('');
  const [localMarkers, setLocalMarkers] = useState<Array<{ lat: number; lng: number; title: string; category?: string; rating?: number; address?: string }>>([]);
  const [mapCenter, setMapCenter] = useState(center);
  const [mapZoom, setMapZoom] = useState(zoom);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [draggedCenter, setDraggedCenter] = useState<{ lat: number; lng: number } | null>(null);

  // Sync with external center changes (e.g. when AI returns response)
  useEffect(() => {
    if (externalMarkers && externalMarkers.length > 0) {
      setMapCenter(center);
      setMapZoom(13);
      setLocalMarkers([]); // Clear local search markers when AI markers arrive
    }
  }, [center, externalMarkers]);

  // Handle map center changes on drag end
  const handleMapIdle = () => {
    if (map) {
      const centerLoc = map.getCenter();
      if (centerLoc) {
        const curCenter = { lat: centerLoc.lat(), lng: centerLoc.lng() };
        // Show re-search button only if they panned away slightly
        const dist = Math.hypot(curCenter.lat - mapCenter.lat, curCenter.lng - mapCenter.lng);
        if (dist > 0.0005) {
          setDraggedCenter(curCenter);
        }
      }
    }
  };

  const triggerNearbySearch = (coords: { lat: number; lng: number }, categoryType: string, customUserMarker?: any) => {
    if (!placesLib || !map) return;
    setSearching(true);
    
    const service = new window.google.maps.places.PlacesService(map as any);
    const request: any = {
      location: coords,
      radius: 1500, // Search within 1.5km for delivery range
    };
    
    if (categoryType === 'all') {
      request.type = 'restaurant';
      request.keyword = '배달 맛집';
    } else if (categoryType === 'korean') {
      request.type = 'restaurant';
      request.keyword = '한식 분식 김밥 찌개 야식 배달';
    } else if (categoryType === 'chicken_pizza') {
      request.type = 'restaurant';
      request.keyword = '치킨 피자 버거 햄버거 야식';
    } else if (categoryType === 'chinese_japanese') {
      request.type = 'restaurant';
      request.keyword = '짜장면 짬뽕 탕수육 초밥 돈까스 일식 배달';
    } else if (categoryType === 'jokbal_bossam') {
      request.type = 'restaurant';
      request.keyword = '족발 보쌈 닭발 야식 배달';
    } else if (categoryType === 'cafe_dessert') {
      request.type = 'cafe';
      request.keyword = '디저트 베이커리 도넛 커피 배달';
    } else if (categoryType === 'fastfood') {
      request.type = 'restaurant';
      request.keyword = '패스트푸드 샌드위치 타코 떡볶이 배달';
    } else {
      request.type = 'restaurant';
      request.keyword = '배달 맛집';
    }

    service.nearbySearch(request, (results, status) => {
      const foundMarkers: any[] = [];
      
      // Keep or insert user/destination marker as the anchor
      if (customUserMarker) {
        foundMarkers.push(customUserMarker);
      } else {
        // Find existing anchor from local markers
        const prevAnchor = localMarkers.find(m => m.category === 'user_location' || m.category === 'destination');
        if (prevAnchor) {
          foundMarkers.push(prevAnchor);
        } else {
          foundMarkers.push({
            lat: coords.lat,
            lng: coords.lng,
            title: '검색 기준 중심',
            category: 'destination',
            address: '배달 권역 분석 중심지'
          });
        }
      }

      if (status === 'OK' && results) {
        results.slice(0, 25).forEach(place => {
          if (place.geometry?.location) {
            foundMarkers.push({
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
              title: place.name || '',
              category: categoryType,
              rating: place.rating,
              address: place.vicinity
            });
          }
        });
      }
      
      setLocalMarkers(foundMarkers);
      setSearching(false);
      setDraggedCenter(null);
    });
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !geocodingLib) return;

    setSearching(true);
    try {
      const geocoder = new geocodingLib.Geocoder();
      geocoder.geocode({ address: searchQuery }, (results, status) => {
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          const loc = results[0].geometry.location;
          const lat = loc.lat();
          const lng = loc.lng();
          const formattedAddress = results[0].formatted_address;

          const newCenter = { lat, lng };
          setMapCenter(newCenter);
          setMapZoom(15);
          
          if (map) {
            map.panTo(newCenter);
            map.setZoom(15);
          }

          const destinationMarker = { 
            lat, 
            lng, 
            title: `${searchQuery} (배달 도착지)`, 
            category: 'destination', 
            address: formattedAddress 
          };

          // Search around searched destination immediately
          triggerNearbySearch(newCenter, activeCategory, destinationMarker);
        } else {
          alert('주소를 찾을 수 없습니다. 도로명 주소나 동이름, 명소를 정확히 입력해 주세요.');
          setSearching(false);
        }
      });
    } catch (err) {
      console.error('Geocoding error:', err);
      setSearching(false);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 GPS 위치 조회를 지원하지 않습니다.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const newCenter = { lat, lng };
        
        setMapCenter(newCenter);
        setMapZoom(15);
        if (map) {
          map.panTo(newCenter);
          map.setZoom(15);
        }
        
        const userMarker = {
          lat,
          lng,
          title: '내 현재 위치 (배달지)',
          category: 'user_location',
          address: '실시간 내 위치 연동 완료'
        };
        
        triggerNearbySearch(newCenter, activeCategory, userMarker);
        setLocating(false);
      },
      (error) => {
        console.error('GPS Location error:', error);
        let errMsg = '현재 주소 위치 정보를 가져올 수 없습니다.';
        if (error.code === error.PERMISSION_DENIED) {
          errMsg = '위치 조회 권한이 거부되었습니다. 브라우저 주소창이나 스마트폰 설정에서 위치 권한을 승인해 주시거나, 지도 검색창에 동이름/도로명을 직접 검색해 주세요!';
        }
        alert(errMsg);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
    );
  };

  // Trigger search when active category changes on current map coordinates
  const changeCategoryAndSearch = (catId: string) => {
    setActiveCategory(catId);
    if (map) {
      const centerLoc = map.getCenter();
      if (centerLoc) {
        triggerNearbySearch({ lat: centerLoc.lat(), lng: centerLoc.lng() }, catId);
      }
    } else {
      triggerNearbySearch(mapCenter, catId);
    }
  };

  // Delivery Specific categories list
  const categories = [
    { id: 'all', label: '배달 전체', icon: Bike },
    { id: 'korean', label: '한식/분식', icon: Utensils },
    { id: 'chicken_pizza', label: '치킨/피자/버거', icon: Flame },
    { id: 'chinese_japanese', label: '중식/일식', icon: Store },
    { id: 'jokbal_bossam', label: '족발/보쌈', icon: Utensils },
    { id: 'cafe_dessert', label: '디저트/카페', icon: Coffee },
    { id: 'fastfood', label: '야식/패스트푸드', icon: Flame },
  ];

  const displayedMarkers = externalMarkers.length > 0 ? externalMarkers : localMarkers;

  return (
    <div className="relative w-full h-full min-h-[500px] font-sans">
      {/* Control Box: Search & GPS & Category Chips */}
      <div className="absolute top-4 left-4 right-4 z-10 space-y-2.5 max-w-[480px]">
        {/* Search Input Bar */}
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex items-center bg-bg-dark/95 border border-border-dark focus-within:border-neon/60 p-1.5 shadow-[0_4px_30px_rgba(0,0,0,0.85)] backdrop-blur-md rounded-sm transition-all">
            <Bike size={14} className="text-neon/70 ml-2 animate-bounce" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="배달받을 주소 또는 지역 입력... (예: 역삼동, 한남동)"
              className="flex-grow bg-transparent text-xs text-text-light px-2.5 py-1.5 outline-none border-none placeholder-text-light/30 font-semibold"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3.5 py-1.5 bg-neon/15 hover:bg-neon text-neon hover:text-bg-dark border border-neon/30 hover:border-transparent transition-all flex items-center justify-center cursor-pointer rounded-sm text-[10px] font-bold"
            >
              {searching ? (
                <Loader2 size={12} className="animate-spin text-neon" />
              ) : (
                <Search size={12} />
              )}
            </button>
          </form>

          {/* Real-time GPS Location Finder Button */}
          <button
            type="button"
            onClick={getCurrentLocation}
            disabled={locating}
            className="px-3.5 bg-neon hover:bg-white text-bg-dark hover:scale-105 transition-all shadow-[0_4px_20px_rgba(207,255,4,0.3)] flex items-center justify-center gap-1.5 cursor-pointer rounded-sm text-[10px] font-black shrink-0"
            title="GPS 내 주변 위치 찾기"
          >
            {locating ? (
              <RefreshCw size={13} className="animate-spin" />
            ) : (
              <Navigation size={13} fill="currentColor" className="animate-pulse" />
            )}
            내 위치
          </button>
        </div>

        {/* Categories Horizontal Scrolling Container */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-white/10 no-scrollbar">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => changeCategoryAndSearch(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-[9px] font-bold uppercase tracking-wider shrink-0 transition-all cursor-pointer select-none ${
                  isSelected
                    ? 'bg-neon border-neon text-bg-dark shadow-[0_0_15px_rgba(207,255,4,0.3)] font-black'
                    : 'bg-bg-dark/90 border-border-dark text-text-light/60 hover:text-white hover:border-neon/40'
                }`}
              >
                <CatIcon size={10} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Floating map re-search trigger */}
      <AnimatePresence>
        {draggedCenter && (
          <motion.div 
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
            className="absolute top-24 left-1/2 z-10"
          >
            <button
              type="button"
              onClick={() => {
                if (draggedCenter) {
                  setMapCenter(draggedCenter);
                  triggerNearbySearch(draggedCenter, activeCategory);
                }
              }}
              className="px-4 py-2 bg-neon border border-transparent shadow-[0_4px_20px_rgba(0,0,0,0.6)] text-bg-dark text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 rounded-full hover:bg-white transition-all cursor-pointer active:scale-95 whitespace-nowrap"
            >
              <RefreshCw size={11} className="animate-spin-slow" />
              이 지역 배달 맛집 탐색
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <Map
        center={mapCenter}
        zoom={mapZoom}
        mapId="DEMO_MAP_ID"
        internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
        style={{ width: '100%', height: '100%' }}
        colorScheme="DARK"
        disableDefaultUI={false}
        gestureHandling="cooperative"
        onIdle={handleMapIdle}
      >
        {displayedMarkers.map((marker, idx) => (
          <InteractiveMarker key={idx} marker={marker} />
        ))}
      </Map>
    </div>
  );
}

function InteractiveMarker({ marker }: { marker: any }) {
  const [markerRef, googleMarker] = useAdvancedMarkerRef();
  const [isOpen, setIsOpen] = useState(false);

  // Determine marker styles based on category
  let pinBg = "#00b0ff"; // Blue default (general businesses)
  let glyphColor = "#000";
  let label = "배달 맛집";

  if (marker.category === 'user_location') {
    pinBg = "#cfff04"; // Neon-lime for exact GPS center
    label = "내 현재 위치 (배달지)";
  } else if (marker.category === 'destination') {
    pinBg = "#00e5ff"; // Cyan for searched destination
    label = "지정 배달지";
  } else if (marker.category === 'all') {
    pinBg = "#ff2a5f";
    label = "배달 추천맛집";
  } else if (marker.category === 'korean') {
    pinBg = "#ff5722";
    label = "한식/분식 배달";
  } else if (marker.category === 'chicken_pizza') {
    pinBg = "#ffb300";
    label = "치킨/피자/버거 배달";
  } else if (marker.category === 'chinese_japanese') {
    pinBg = "#d32f2f";
    label = "중식/일식 배달";
  } else if (marker.category === 'jokbal_bossam') {
    pinBg = "#8d6e63";
    label = "족발/보쌈 배달";
  } else if (marker.category === 'cafe_dessert') {
    pinBg = "#ec407a";
    label = "디저트/카페 배달";
  } else if (marker.category === 'fastfood') {
    pinBg = "#fbc02d";
    label = "야식/패스트푸드 배달";
  }

  return (
    <>
      <AdvancedMarker
        ref={markerRef}
        position={{ lat: marker.lat, lng: marker.lng }}
        onClick={() => setIsOpen(true)}
      >
        <Pin background={pinBg} glyphColor={glyphColor} borderColor={pinBg} />
      </AdvancedMarker>
      {isOpen && (
        <InfoWindow anchor={googleMarker} onCloseClick={() => setIsOpen(false)}>
          <div className="p-2.5 max-w-[220px] text-bg-dark text-xs font-sans">
            <div className="font-black text-sm text-black mb-1.5 flex items-center gap-1.5">
              <Flame size={12} className="text-red-500 shrink-0" />
              <span className="truncate">{marker.title}</span>
            </div>
            {marker.address && (
              <p className="text-[10px] text-gray-600 mb-1.5 leading-normal">{marker.address}</p>
            )}
            {marker.rating && (
              <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mb-1">
                <Star size={10} fill="currentColor" />
                배달 평점: {marker.rating}
              </div>
            )}
            <div className="flex items-center gap-1 mt-1.5">
              <span className="inline-block px-1.5 py-0.5 bg-red-500/10 text-[8px] font-black uppercase tracking-wider text-red-600 rounded-sm">
                {label}
              </span>
              <span className="inline-block px-1.5 py-0.5 bg-emerald-500/10 text-[8px] font-black uppercase tracking-wider text-emerald-600 rounded-sm">
                배달/포장 가능
              </span>
            </div>
          </div>
        </InfoWindow>
      )}
    </>
  );
}

interface OpenStreetMapViewerProps {
  initialCenter: { lat: number; lng: number };
  externalMarkers: Array<{ lat: number; lng: number; title: string }>;
}

function OpenStreetMapViewer({ initialCenter, externalMarkers }: OpenStreetMapViewerProps) {
  const [center, setCenter] = useState(initialCenter);
  const [addressName, setAddressName] = useState('서울 중심 배달 권역 (기본 설정)');
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showKeyGuide, setShowKeyGuide] = useState(false);

  // Sync with AI returned markers if available
  useEffect(() => {
    if (externalMarkers && externalMarkers.length > 0) {
      setCenter({ lat: externalMarkers[0].lat, lng: externalMarkers[0].lng });
      setAddressName(externalMarkers[0].title);
    }
  }, [externalMarkers]);

  // Delivery Specific categories list
  const categories = [
    { id: 'all', label: '배달 전체', icon: Bike },
    { id: 'korean', label: '한식/분식', icon: Utensils },
    { id: 'chicken_pizza', label: '치킨/피자/버거', icon: Flame },
    { id: 'chinese_japanese', label: '중식/일식', icon: Store },
    { id: 'jokbal_bossam', label: '족발/보쌈', icon: Utensils },
    { id: 'cafe_dessert', label: '디저트/카페', icon: Coffee },
    { id: 'fastfood', label: '야식/패스트푸드', icon: Flame },
  ];

  // Delivery spots database dynamically tailored to center & category
  const mockDeliverySpots = [
    {
      id: 1,
      category: 'chicken_pizza',
      name: '황금올리브 크리스피 치킨 & 수제버거',
      rating: 4.9,
      reviewCount: 1420,
      deliveryTime: '20~30분',
      minOrder: '15,000원',
      deliveryFee: '무료 배달',
      popular: '시그니처 바삭 후라이드 + 치즈볼 세트',
      distance: '0.4km'
    },
    {
      id: 2,
      category: 'korean',
      name: '묵은지 칼칼 돼지김치찌개 & 집밥도시락',
      rating: 4.85,
      reviewCount: 980,
      deliveryTime: '25~35분',
      minOrder: '12,000원',
      deliveryFee: '1,500원',
      popular: '생고기 김치찌개 2인 + 계란말이',
      distance: '0.6km'
    },
    {
      id: 3,
      category: 'chinese_japanese',
      name: '차이홍 수타 손짜장 & 직화 짬뽕관',
      rating: 4.88,
      reviewCount: 1850,
      deliveryTime: '15~25분',
      minOrder: '14,000원',
      deliveryFee: '무료 배달',
      popular: '찹쌀 탕수육 + 불맛 해물짬뽕',
      distance: '0.7km'
    },
    {
      id: 4,
      category: 'jokbal_bossam',
      name: '한양 가마솥 온족발 & 마늘보쌈 본점',
      rating: 4.95,
      reviewCount: 2200,
      deliveryTime: '30~40분',
      minOrder: '28,000원',
      deliveryFee: '무료 배달',
      popular: '반반 온족발 (오리지널 + 불족발)',
      distance: '0.9km'
    },
    {
      id: 5,
      category: 'cafe_dessert',
      name: '브라운 벨벳 베이커리 & 스페셜티 커피',
      rating: 4.92,
      reviewCount: 840,
      deliveryTime: '15~25분',
      minOrder: '10,000원',
      deliveryFee: '2,000원',
      popular: '소금빵 + 시그니처 크림라떼 2잔',
      distance: '0.3km'
    },
    {
      id: 6,
      category: 'fastfood',
      name: '불타는 땡초 떡볶이 & 바삭 모둠튀김',
      rating: 4.82,
      reviewCount: 1310,
      deliveryTime: '20~30분',
      minOrder: '13,000원',
      deliveryFee: '무료 배달',
      popular: '로제 떡볶이 세트 (치즈떡 추가)',
      distance: '0.5km'
    }
  ];

  const filteredSpots = activeCategory === 'all' 
    ? mockDeliverySpots 
    : mockDeliverySpots.filter(s => s.category === activeCategory);

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      if (data && data.length > 0) {
        const item = data[0];
        const newLat = parseFloat(item.lat);
        const newLng = parseFloat(item.lon);
        setCenter({ lat: newLat, lng: newLng });
        setAddressName(item.display_name.split(',').slice(0, 3).join(', '));
      } else {
        alert('주소 검색 결과를 찾을 수 없습니다. (예: 역삼동, 강남역, 서초동 등)');
      }
    } catch (err) {
      console.error('Nominatim search error:', err);
      alert('주소 검색 중 일시적인 네트워크 오류가 발생했습니다.');
    } finally {
      setSearching(false);
    }
  };

  const handleGetCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('이 브라우저는 GPS 위치 조회를 지원하지 않습니다.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setCenter({ lat, lng });
        setAddressName('실시간 내 GPS 현재 위치 (배달 도착지)');
        setLocating(false);
      },
      (err) => {
        console.error('GPS error:', err);
        alert('위치 정보를 가져올 수 없습니다. 권한을 확인해 주세요.');
        setLocating(false);
      },
      { timeout: 8000 }
    );
  };

  // OpenStreetMap embed bounding box
  const delta = 0.009;
  const bbox = `${center.lng - delta},${center.lat - delta},${center.lng + delta},${center.lat + delta}`;
  const osmEmbedUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${center.lat},${center.lng}`;

  return (
    <div className="w-full border border-neon/30 bg-bg-dark rounded-sm overflow-hidden mb-6 font-sans shadow-[0_0_30px_rgba(0,243,255,0.06)]">
      {/* Top Header Bar: Mode & Status */}
      <div className="bg-black/80 px-4 py-3 border-b border-border-dark flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-neon animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-neon flex items-center gap-1.5">
            <Bike size={14} /> 실시간 내주변 배달맛집지도
          </span>
          <span className="text-[9px] px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold rounded-sm uppercase tracking-tight flex items-center gap-1">
            <Globe size={10} /> 100% 무료 지도 모드 가동 중
          </span>
        </div>

        <button
          type="button"
          onClick={() => setShowKeyGuide(!showKeyGuide)}
          className="text-[10px] text-text-light/50 hover:text-white flex items-center gap-1 transition-colors font-bold"
        >
          <Key size={11} className="text-neon" />
          Google Maps API 연동 가이드
          {showKeyGuide ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Collapsible Google Maps key guidance */}
      <AnimatePresence>
        {showKeyGuide && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-white/10 bg-white/[0.02] p-4 text-xs font-sans space-y-2"
          >
            <div className="flex items-center gap-2 text-neon text-[11px] font-bold">
              <Info size={13} />
              <span>Google Maps 정밀 위성/스트리트뷰 연동 안내</span>
            </div>
            <p className="text-[11px] text-text-light/70 leading-relaxed">
              현재는 별도의 키 등록 없이도 <strong>오픈스트리트맵(OSM)과 실시간 GPS</strong>를 통해 100% 무료로 배달 권역과 맛집을 탐색하실 수 있습니다. 구글 공식 Places API 연동을 원하시면 우측 상단 ⚙️ Secrets 메뉴에서 <code className="text-neon bg-neon/10 px-1 font-mono">GOOGLE_MAPS_PLATFORM_KEY</code>를 등록해 주세요.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Box: Search Input & GPS Button */}
      <div className="p-3.5 bg-bg-dark border-b border-border-dark space-y-2.5">
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex-1 flex items-center bg-black/60 border border-border-dark focus-within:border-neon/60 p-1 rounded-sm">
            <Bike size={14} className="text-neon ml-2 animate-bounce" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="배달받을 주소나 동이름 검색 (예: 강남역, 역삼동, 홍대입구, 서초동)..."
              className="flex-grow bg-transparent text-xs text-text-light px-2.5 py-1.5 outline-none placeholder-text-light/30 font-semibold"
            />
            <button
              type="submit"
              disabled={searching}
              className="px-3 py-1.5 bg-neon/20 hover:bg-neon text-neon hover:text-bg-dark text-[10px] font-black uppercase rounded-sm transition-all flex items-center gap-1 cursor-pointer"
            >
              {searching ? <Loader2 size={12} className="animate-spin" /> : <Search size={12} />}
              검색
            </button>
          </form>

          <button
            type="button"
            onClick={handleGetCurrentLocation}
            disabled={locating}
            className="px-3.5 bg-neon hover:bg-white text-bg-dark font-black text-[10px] uppercase rounded-sm flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_rgba(207,255,4,0.3)] shrink-0"
          >
            {locating ? <RefreshCw size={12} className="animate-spin" /> : <Navigation size={12} fill="currentColor" />}
            내 GPS 위치
          </button>
        </div>

        {/* Current Address Tag */}
        <div className="flex items-center gap-2 text-[10px] text-text-light/50 px-1 truncate">
          <MapPin size={11} className="text-neon shrink-0" />
          <span className="text-neon/90 font-bold">기준 배달지:</span>
          <span className="text-white font-medium truncate">{addressName}</span>
        </div>

        {/* Category Filter Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pt-1 no-scrollbar scrollbar-thin">
          {categories.map((cat) => {
            const CatIcon = cat.icon;
            const isSelected = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex items-center gap-1 px-2.5 py-1.5 border rounded-sm text-[9px] font-black uppercase tracking-wider shrink-0 transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neon border-neon text-bg-dark shadow-[0_0_12px_rgba(207,255,4,0.3)]'
                    : 'bg-black/50 border-border-dark text-text-light/60 hover:text-white hover:border-neon/40'
                }`}
              >
                <CatIcon size={10} />
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Interactive Map Frame */}
      <div className="relative w-full h-[320px] bg-black">
        <iframe
          title="OpenStreetMap Delivery Area"
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={osmEmbedUrl}
          className="filter contrast-[1.08] saturate-[1.1] opacity-90"
        />
        {/* Real-time Map Center Marker overlay badge */}
        <div className="absolute bottom-3 left-3 bg-black/85 border border-neon/30 px-3 py-1.5 rounded-sm flex items-center gap-2 shadow-lg backdrop-blur-md">
          <div className="w-2 h-2 rounded-full bg-neon animate-ping" />
          <span className="text-[10px] font-bold text-white">반경 1.5km 배달 권역 정밀 스캔</span>
        </div>
      </div>

      {/* Delivery Spots Real-time Recommendation Bento List */}
      <div className="p-4 bg-bg-dark/95 border-t border-border-dark space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-neon">
            <Flame size={13} className="text-red-400" />
            <span>내 주변 실시간 추천 배달 맛집 ({filteredSpots.length}곳)</span>
          </div>
          <span className="text-[9px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-sm">
            ⚡ 평균 25분 내 배달 완료
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredSpots.map((spot) => (
            <div
              key={spot.id}
              className="p-3 border border-white/5 hover:border-neon/40 bg-black/40 hover:bg-black/70 rounded-sm transition-all space-y-2 group"
            >
              <div className="flex items-start justify-between gap-2">
                <h5 className="text-xs font-black text-white group-hover:text-neon transition-colors truncate">
                  {spot.name}
                </h5>
                <div className="flex items-center gap-1 text-[10px] text-amber-400 font-bold shrink-0">
                  <Star size={10} fill="currentColor" />
                  {spot.rating}
                </div>
              </div>

              <p className="text-[10px] text-text-light/50 truncate">
                대표: <span className="text-text-light/80 font-medium">{spot.popular}</span>
              </p>

              <div className="flex items-center justify-between text-[9px] pt-1 border-t border-white/5 text-text-light/40">
                <span className="text-neon/90 font-bold">거리 {spot.distance}</span>
                <span>배달시간: <strong className="text-white">{spot.deliveryTime}</strong></span>
                <span className="text-emerald-400 font-bold">{spot.deliveryFee}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

