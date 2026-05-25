import { env } from "./env";

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  if (!env.googlePlacesApiKey) return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${env.googlePlacesApiKey}`
    );
    const json = await res.json();
    return json.results?.[0]?.formatted_address ?? `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  } catch {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
}

export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  if (!env.googlePlacesApiKey) return null;
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${env.googlePlacesApiKey}`
    );
    const json = await res.json();
    const loc = json.results?.[0]?.geometry?.location;
    return loc ? { lat: loc.lat, lng: loc.lng } : null;
  } catch {
    return null;
  }
}
