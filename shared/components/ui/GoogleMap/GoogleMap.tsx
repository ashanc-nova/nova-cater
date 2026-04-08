import React, { useRef, useEffect, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, useMap } from '@vis.gl/react-google-maps';
import { GOOGLE_MAPS_API_KEY } from '../../../../configs/environments/config';
import styles from './GoogleMap.module.scss';

declare global {
  namespace google {
    namespace maps {
      interface LatLng {
        lat(): number;
        lng(): number;
      }

      interface LatLngBounds {
        // Minimal declaration for bounds
      }

      class Geocoder {
        constructor();
        geocode(
          request: { location: LatLng | LatLngLiteral },
          callback: (
            results: google.maps.GeocoderResult[],
            status: google.maps.GeocoderStatus
          ) => void
        ): void;
      }

      class Map {
        fitBounds(bounds: LatLngBounds): void;
        setCenter(latlng: LatLng | LatLngLiteral): void;
        setZoom(level: number): void;
      }

      namespace event {
        function addListener(
          instance: Map,
          eventName: string,
          handler: (e: any) => void
        ): MapsEventListener;
        function removeListener(listener: MapsEventListener): void;
      }

      // Update DirectionsResult to use LatLngBounds
      interface DirectionsResult {
        routes: Array<{
          bounds: LatLngBounds;
        }>;
      }

      enum TravelMode {
        DRIVING = 'DRIVING',
      }
      enum DirectionsStatus {
        OK = 'OK',
        REQUEST_DENIED = 'REQUEST_DENIED',
      }
      interface DirectionsRequest {
        origin: google.maps.LatLngLiteral | string;
        destination: google.maps.LatLngLiteral | string;
        travelMode: google.maps.TravelMode;
      }
      interface DirectionsRendererOptions {
        map?: google.maps.Map;
        suppressMarkers?: boolean;
      }
      class DirectionsRenderer {
        constructor(options?: google.maps.DirectionsRendererOptions);
        setMap(map?: google.maps.Map | null): void;
        setDirections(directions: google.maps.DirectionsResult): void;
      }
      class DirectionsService {
        route(
          request: google.maps.DirectionsRequest,
          callback: (
            result: google.maps.DirectionsResult | null,
            status: google.maps.DirectionsStatus
          ) => void
        ): void;
      }
      interface LatLngLiteral {
        lat: number;
        lng: number;
      }
      interface MapsEventListener {
        remove(): void;
      }

      interface MapMouseEvent {
        latLng: LatLng | null;
      }

      namespace places {
        // Update PlaceResult to use LatLng consistently
        interface PlaceResult {
          formatted_address?: string;
          geometry?: {
            location?: LatLng;
          };
        }

        interface AutocompleteOptions {
          fields?: string[];
          types?: string[];
        }

        class Autocomplete {
          constructor(inputField: HTMLInputElement, opts?: AutocompleteOptions);
          getPlace(): PlaceResult;
          addListener(
            eventName: string,
            handler: (this: Autocomplete, ...args: any[]) => void
          ): google.maps.MapsEventListener;
        }
      }

      interface GeocoderResult {
        formatted_address: string;
      }

      enum GeocoderStatus {
        OK = 'OK',
      }
    }
  }
}

interface LocationData {
  lat: number;
  lng: number;
}

interface GoogleMapProps {
  center?: LocationData;
  zoom?: number;
  height?: string;
  width?: string;
  showMarker?: boolean;
  className?: string;
  userLocation?: LocationData | null;
  restaurantLocation?: LocationData;
  selectedLocation?: LocationData; // Added
  onMapClick?: (location: LocationData) => void; // Added for raw click
  onLocationSelect?: (address: string, location: LocationData) => void; // Added for geocoded select
}

const defaultCenter: LocationData = {
  lat: 37.3387, // San Jose, CA coordinates
  lng: -121.8853,
};

interface MapContentProps {
  onMapClick?: (location: LocationData) => void;
  onLocationSelect?: (address: string, location: LocationData) => void;
  selectedLocation?: LocationData;
  userLocation?: LocationData | null;
  restaurantLocation?: LocationData;
  effectiveCenter: LocationData;
  showMarker: boolean;
  hasLocations: LocationData | null | undefined | false;
}

const MapContent = ({
  onMapClick,
  onLocationSelect,
  selectedLocation,
  userLocation,
  restaurantLocation,
  effectiveCenter,
  showMarker,
  hasLocations,
}: MapContentProps) => {
    const map = useMap();
    const geocoder = useMemo(() => new google.maps.Geocoder(), []); // Added manual geocoder
    const directionsRendererRef = useRef<google.maps.DirectionsRenderer | null>(null);
    const isDraggingRef = useRef(false);
    const markerRef = useRef<any>(null);

    useEffect(() => {
      if (!map) return;

      if (directionsRendererRef.current) {
        directionsRendererRef.current.setMap(null);
      }

      directionsRendererRef.current = new google.maps.DirectionsRenderer({
        map,
        suppressMarkers: true,
      });
    }, [map]);

    useEffect(() => {
      if (!map || !userLocation || !restaurantLocation || !directionsRendererRef.current) return;

      const service = new google.maps.DirectionsService();
      service.route(
        {
          origin: userLocation,
          destination: restaurantLocation,
          travelMode: google.maps.TravelMode.DRIVING,
        },
        (result, status) => {
          if (status === google.maps.DirectionsStatus.OK && result) {
            directionsRendererRef.current?.setDirections(result);
            const route = result.routes[0];
            if (route && route.bounds) {
              map.fitBounds(route.bounds);
            }
          } else {
            console.error('Directions request failed in GoogleMap:', status);
          }
        }
      );
    }, [map, userLocation, restaurantLocation]);

    useEffect(() => {
      if (!map) return;

      const listener = google.maps.event.addListener(map, 'click', (e) => {
        // Don't trigger click event if we're dragging the marker
        if (isDraggingRef.current) {
          isDraggingRef.current = false;
          return;
        }

        if (e.latLng && (onMapClick || onLocationSelect)) {
          const lat = e.latLng.lat();
          const lng = e.latLng.lng();
          const location = { lat, lng };
          onMapClick?.(location);
          if (onLocationSelect) {
            geocoder.geocode({ location: e.latLng }, (results, status) => {
              if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
                const address = results[0].formatted_address || '';
                onLocationSelect(address, location);
              } else {
                onLocationSelect('', location);
              }
            });
          }
        }
      });

      return () => {
        google.maps.event.removeListener(listener);
      };
    }, [map, geocoder, onMapClick, onLocationSelect]); // Include geocoder in deps if needed, but stable

    useEffect(() => {
      if (selectedLocation && map) {
        map.setCenter(selectedLocation);
        map.setZoom(10);
      }
    }, [map, selectedLocation]);

    // Handler for when marker drag starts
    const handleDragStart = () => {
      isDraggingRef.current = true;
    };

    // Handler for when marker drag ends
    const handleDragEnd = (e: any) => {
      if (!onLocationSelect) return;

      // Get the new position from the event
      // The @vis.gl/react-google-maps library passes the event with latLng
      let latLng: google.maps.LatLng | null = null;
      let location: LocationData | null = null;

      if (e?.latLng) {
        latLng = e.latLng;
        location = { lat: latLng.lat(), lng: latLng.lng() };
      } else if (e?.detail?.latLng) {
        latLng = e.detail.latLng;
        location = { lat: latLng.lat(), lng: latLng.lng() };
      } else if (e?.lat !== undefined && e?.lng !== undefined) {
        // Direct lat/lng in event
        location = { lat: e.lat, lng: e.lng };
        latLng = {
          lat: () => e.lat,
          lng: () => e.lng,
        } as google.maps.LatLng;
      }

      if (!location || !latLng) return;

      // Update map center to the new location
      if (map) {
        map.setCenter(location);
      }

      // Geocode the new location
      geocoder.geocode({ location: latLng }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results.length > 0) {
          const address = results[0].formatted_address || '';
          onLocationSelect(address, location!);
        } else {
          onLocationSelect('', location!);
        }
      });

      // Reset dragging flag after a short delay to prevent click event
      setTimeout(() => {
        isDraggingRef.current = false;
      }, 100);
    };

    return (
      <>
        {restaurantLocation && (
          <AdvancedMarker position={restaurantLocation}>
            <Pin />
          </AdvancedMarker>
        )}
        {userLocation && (
          <AdvancedMarker position={userLocation}>
            <Pin />
          </AdvancedMarker>
        )}
        {!selectedLocation && showMarker && !hasLocations && (
          <AdvancedMarker position={effectiveCenter}>
            <Pin />
          </AdvancedMarker>
        )}
        {selectedLocation && (
          <AdvancedMarker
            ref={markerRef}
            position={selectedLocation}
            draggable={true}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <Pin />
          </AdvancedMarker>
        )}
      </>
    );
};

const GoogleMap: React.FC<GoogleMapProps> = ({
  center = defaultCenter,
  zoom = 10,
  height = '280px',
  width = '100%',
  showMarker = true,
  className = '',
  userLocation,
  restaurantLocation,
  selectedLocation,
  onMapClick,
  onLocationSelect,
}) => {
  const containerStyle = useMemo(
    () => ({
      width,
      height,
    }),
    [width, height]
  );

  const mapOptions = useMemo(
    () => ({
      disableDefaultUI: false,
      zoomControl: false,
      mapTypeControl: false,
      scaleControl: false,
      streetViewControl: false,
      rotateControl: false,
      fullscreenControl: false,
    }),
    []
  );

  const effectiveCenter = useMemo(() => {
    if (userLocation && restaurantLocation) {
      return {
        lat: (userLocation.lat + restaurantLocation.lat) / 2,
        lng: (userLocation.lng + restaurantLocation.lng) / 2,
      };
    }
    if (restaurantLocation) {
      return restaurantLocation;
    }
    return center;
  }, [center, userLocation, restaurantLocation]);

  const effectiveZoom = useMemo(() => {
    if (userLocation && restaurantLocation) {
      return 12;
    }
    return zoom;
  }, [zoom, userLocation, restaurantLocation]);

  const hasLocations = userLocation && restaurantLocation;

  return (
    <div className={`${styles.mapContainer} ${className}`}>
      <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={['places']}>
        <Map
          defaultCenter={effectiveCenter}
          defaultZoom={effectiveZoom}
          mapId="DEMO_MAP_ID" // Replace with your actual mapId from Google Cloud Console
          style={containerStyle}
          options={mapOptions}
        >
          <MapContent
            onMapClick={onMapClick}
            onLocationSelect={onLocationSelect}
            selectedLocation={selectedLocation}
            userLocation={userLocation}
            restaurantLocation={restaurantLocation}
            effectiveCenter={effectiveCenter}
            showMarker={showMarker}
            hasLocations={hasLocations}
          />
        </Map>
      </APIProvider>
    </div>
  );
};

export default GoogleMap;
