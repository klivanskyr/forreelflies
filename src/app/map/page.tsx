'use client';

import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import React, { useEffect, useState } from 'react';
import { Suggestion } from "@/app/types/types";
import Input from '@/components/inputs/Input';

const DEFAULT_CENTER: L.LatLngExpression = [40.7128, -74.0060];
const DEFAULT_ZOOM: number = 9;

const markerIcon: L.Icon = new L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [25,41]
});

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
      icon={markerIcon}
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

function MapWithMarker({ zoom, center, location, setLocation }: { zoom: number, center: LatLngExpression, location: LatLngExpression | null, setLocation: React.Dispatch<React.SetStateAction<LatLngExpression | null>> }) {
  return (
    <div>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '500px', width: '100%' }}
      >
        <TileLayer
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          attribution='&copy; OpenStreetMap contributors'
        />
        <LocationMarker position={location} setPosition={setLocation} />
      </MapContainer>

      {location && (
        <div className="mt-4 text-sm">
          Selected Location: <b>{location[0].toFixed(5)}, {location[1].toFixed(5)}</b>
        </div>
      )}
    </div>
  );
}

function AutocompleteAddress({ input, setInput, setLocation }: { input: string, setInput: React.Dispatch<React.SetStateAction<string>>, setLocation: React.Dispatch<React.SetStateAction<LatLngExpression | null>> }) {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);

  const fetchSuggestions = async (text: string) => {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/geo/autocomplete?text=${text}`, {
      method: "GET"
    })
    const json = await res.json();

    console.log("suggestions: ", json.suggestions);
    setSuggestions(json.suggestions);
    setShowSuggestions(true);
  } catch (error) {
    setSuggestions([]);
    setShowSuggestions(false);
  }
}

  useEffect(() => {
    // We dont want to just send an api call on every character because theres a limit
    // only updates suggestions on an even number of characters starting at 4
    if (input.length > 3) {
      fetchSuggestions(input);
    }
  }, [input])

  return (
    <div className="relative w-fit flex flex-col">
      <Input 
        className={`border-2 ${showSuggestions ? "rounded-b-none" : ""} !m-0`} 
        type='text' 
        value={input} 
        onChange={(e) => setInput(e.target.value)}
      />
      {showSuggestions && <div className='border-l-2 border-r-2 border-b-2 rounded-md rounded-t-none'>
          {suggestions.map(suggestion => (
            <div className="w-full h-[40px] px-3 py-2 my-2 hover:bg-gray-200 hover:cursor-pointer">
              <h2 onClick={() => {setInput(suggestion.formatted); setShowSuggestions(false); setLocation([suggestion.latitude, suggestion.longitude])}}>{suggestion.formatted}</h2>
            </div>
          ))}
      </div>}
    </div>
  )
}

export default function Page() {
  const [input, setInput] = useState<string>("");
  const [location, setLocation] = useState<LatLngExpression | null>(null)
  const [center, setCenter] = useState<LatLngExpression>(DEFAULT_CENTER);
  const [zoom, setZoom] = useState<number>(DEFAULT_ZOOM);
  const [flies, setFlies] = useState<any[]>([]);

  const handleFormSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
  }

  useEffect(() => {
    if (location) {
      setCenter(location)
      setZoom(13)
    }
  }, [location, setCenter, setZoom])

  const fetchFlies = async () => {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/`)
  }

  return (
    <div>
      <div>
        <h1>Search below for your next Fly Fishing trip.</h1>
        <p>We will give you the perfect results for which flies are needed!</p>
      </div>
      <div>
        <h2>Either click below on the map or enter a location here.</h2>
        <form onSubmit={(e) => handleFormSubmit(e)}>
          <AutocompleteAddress input={input} setInput={setInput} setLocation={setLocation} />
          <button type='submit'>Search</button>
        </form>
      </div>
      
      <MapWithMarker center={center} zoom={zoom} location={location} setLocation={setLocation} />

      <div>
        <button onClick={() => fetchFlies()}>search for flies</button>
      </div>
    </div>
  );
}
