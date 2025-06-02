'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { useState } from 'react';

const DEFAULT_CENTER: L.LatLngExpression = [40.7128, -74.0060];
const DEFAULT_ZOOM: number = 7;

function LocationMarker({
  position,
  setPosition,
}: {
  position: LatLngExpression | null;
  setPosition: (pos: LatLngExpression) => void;
}) {
  useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
    },
  });

  return position ? (
    <Marker
      
      position={position}
      eventHandlers={{
        dragend(e) {
          const marker = e.target;
          const latLng = marker.getLatLng();
          setPosition([latLng.lat, latLng.lng]);
        },
      }}
    />
  ) : null;
}

function MapWithMarker() {
  const [position, setPosition] = useState<LatLngExpression | null>(null);

  return (
    <div>
      <MapContainer
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />
        <LocationMarker position={position} setPosition={setPosition} />
      </MapContainer>

      {position && (
        <div className="mt-4 text-sm">
          Selected Location: <b>{position[0].toFixed(5)}, {position[1].toFixed(5)}</b>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <div>
      <h1>Before</h1>
      <MapWithMarker />
      <h1>After</h1>
    </div>
  );
}
