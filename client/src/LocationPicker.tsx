import { useEffect, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';
import { Button, Modal } from './components';
import { loadMaps } from './services/maps';
export type LocationPoint = { lat: number; lng: number; placeId?: string };
export function LocationPicker({ value, point, onChange }: { value: string; point?: LocationPoint; onChange: (value: string, point?: LocationPoint) => void }) {
  const [open, setOpen] = useState(false);
  return <div className="location-picker"><label htmlFor="profile-location">Where do you plan to open your business?</label><div className="location-input-row"><input id="profile-location" value={value} readOnly aria-describedby="location-selection-help" placeholder="Choose a place on the map" /><button type="button" className="draft-edit-button" aria-label="Search places or choose on map" title="Search places or choose on map" onClick={() => setOpen(true)}><MapPin size={20}/></button></div><button type="button" id="location-selection-help" className="text-button" onClick={() => setOpen(true)}>Search or pin a place</button>{open && <MapPicker initial={point} onClose={() => setOpen(false)} onSelect={(label, chosen) => { onChange(label, chosen); setOpen(false); }}/>}</div>;
}
function MapPicker({ initial, onClose, onSelect }: { initial?: LocationPoint; onClose: () => void; onSelect: (label: string, point: LocationPoint) => void }) {
  const search = useRef<HTMLDivElement>(null), canvas = useRef<HTMLDivElement>(null);
  const pickPoint = useRef<(point:LocationPoint)=>void>(()=>{});
  const [locating,setLocating] = useState(false);
  const [selection, setSelection] = useState<{ label: string; point: LocationPoint }>();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let cancelled = false;
    let widget: google.maps.places.PlaceAutocompleteElement;
    let listener: google.maps.MapsEventListener;
    let marker: google.maps.marker.AdvancedMarkerElement;
    let sequence = 0;
    const authError = () => { setError('Google rejected the Maps key. Update the key in your local configuration, then reload.'); setLoading(false); };
    window.addEventListener('bizz-maps-auth-error', authError);
    async function init() {
      try {
        await loadMaps();
        const [maps, places, markers] = await Promise.all([google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>, google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>, google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>]);
        if (cancelled || !canvas.current || !search.current) return;
        const map = new maps.Map(canvas.current, { center: initial || { lat:14.5995,lng:120.9842 }, zoom:initial ? 14 : 5, mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID', mapTypeControl:false, streetViewControl:false });
        marker = new markers.AdvancedMarkerElement({map, position:initial});
        widget = new places.PlaceAutocompleteElement({});
        widget.setAttribute('aria-label', 'Search city or address');
        search.current.appendChild(widget);
        widget.addEventListener('gmp-error', () => setError('Place search is unavailable. Check Places API access, or pick on the map.'));
        widget.addEventListener('gmp-select', async event => {
          setLocating(false);
          const request = ++sequence; setSelection(undefined); setError('');
          try {
            const place = (event as google.maps.places.PlacePredictionSelectEvent).placePrediction.toPlace();
            await place.fetchFields({fields:['location','formattedAddress','displayName']});
            if (cancelled || request !== sequence || !place.location) return;
            const point = {...place.location.toJSON(),placeId:place.id};
            marker.position = point; map.panTo(point); map.setZoom(14);
            setSelection({label:(place.formattedAddress || place.displayName || '').slice(0,200), point});
          } catch { if (!cancelled) setError('Could not select this place. Try another result.'); }
        });
        pickPoint.current = async point => {
          const request=++sequence; marker.position=point; map.panTo(point); map.setZoom(15); setSelection(undefined); setError(''); setLocating(true);
          try {
            const {Geocoder}=await google.maps.importLibrary('geocoding') as google.maps.GeocodingLibrary;
            const {results}=await new Geocoder().geocode({location:point});
            if(cancelled || request!==sequence) return;
            if(!results[0]) throw new Error('No address');
            setSelection({label:results[0].formatted_address.slice(0,200),point:{...point,placeId:results[0].place_id}});
          } catch {if(!cancelled && request===sequence){setSelection({label:'Map pin ('+point.lat.toFixed(5)+', '+point.lng.toFixed(5)+')',point});setError('No place name available. Search a nearby named place, or keep this pin.');}}
          finally {if(!cancelled && request===sequence)setLocating(false);}
        };
        listener = map.addListener('click', (event: google.maps.MapMouseEvent) => {
          if (!event.latLng) return;
          pickPoint.current(event.latLng.toJSON());
        });
        setLoading(false);
      } catch(e) { if (!cancelled) {setError((e as Error).message);setLoading(false);} }
    }
    void init();
    return () => { window.removeEventListener('bizz-maps-auth-error', authError); cancelled=true; listener?.remove(); widget?.remove(); if(marker) marker.map=null; };
  }, [initial]);
  return <Modal title="Choose your location" onClose={onClose}><div ref={search}/><Button variant="secondary" disabled={loading || locating} onClick={()=>{if(!navigator.geolocation){setError("Location is not supported by your browser.");return;}setLocating(true);navigator.geolocation.getCurrentPosition(p=>pickPoint.current({lat:p.coords.latitude,lng:p.coords.longitude}),()=>{setLocating(false);setError("Location access was denied or unavailable. Search or pin a place instead.");},{timeout:10000});}}>Use current location</Button>{locating && <p role="status">Finding the place name…</p>}{loading && <p role="status">Loading map…</p>}<p>Search a place or click the map to drop a pin.</p><div className="location-map" ref={canvas}/>{error && <p role="alert">{error}</p>}{selection && <div className="selected-location" role="status"><strong>Selected location</strong><p>{selection.label}</p></div>}<Button disabled={locating || !selection?.label.trim()} onClick={() => selection && onSelect(selection.label,selection.point)}>Use this location</Button></Modal>;
}
