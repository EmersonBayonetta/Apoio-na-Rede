import { loadGoogleMaps } from '../lib/googleMaps';
export interface StreetViewScene { pano: string; heading: number }
export async function streetViewImage(latitude: number, longitude: number): Promise<StreetViewScene | null> {
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  await loadGoogleMaps();
  const { StreetViewService, StreetViewSource, StreetViewPreference } = await google.maps.importLibrary('streetView') as google.maps.StreetViewLibrary;
  const { spherical } = await google.maps.importLibrary('geometry') as google.maps.GeometryLibrary;
  try {
    const { data } = await new StreetViewService().getPanorama({ location: { lat: latitude, lng: longitude }, radius: 50, sources: [StreetViewSource.OUTDOOR], preference: StreetViewPreference.NEAREST });
    if (!data.location?.pano || !data.location.latLng) return null;
    return { pano: data.location.pano, heading: spherical.computeHeading(data.location.latLng, new google.maps.LatLng(latitude, longitude)) };
  } catch (error) {
    if ((error as { code?: string }).code === 'ZERO_RESULTS') return null;
    throw error;
  }
}
