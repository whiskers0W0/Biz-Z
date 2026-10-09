import { useRef, useState } from 'react';
import type { Idea, Profile } from './data';
import { loadMaps } from './services/maps';
import { Button } from './components';
export function LocalCompetition({idea, profile}: {idea:Idea; profile:Profile}) {
  const [open,setOpen]=useState(false), [busy,setBusy]=useState(false), [error,setError]=useState('');
  const [places,setPlaces]=useState<google.maps.places.Place[] | null>(null);
  const canvas=useRef<HTMLDivElement>(null);
  async function find() {
    setBusy(true);setError('');
    try {
      await loadMaps();
      const [{Place},{Map},{AdvancedMarkerElement}] = await Promise.all([google.maps.importLibrary('places') as Promise<google.maps.PlacesLibrary>,google.maps.importLibrary('maps') as Promise<google.maps.MapsLibrary>,google.maps.importLibrary('marker') as Promise<google.maps.MarkerLibrary>]);
      const {places:found}=await Place.searchByText({textQuery:`${idea.competitorQuery || idea.name} near ${profile.location}`,fields:['id','displayName','formattedAddress','location','googleMapsURI'],maxResultCount:5,...(profile.locationPoint ? {locationBias:{center:profile.locationPoint,radius:5000}} : {})});
      setPlaces(found);
      await new Promise<void>(resolve => requestAnimationFrame(() => resolve()));
      if(canvas.current) {
        const map=new Map(canvas.current,{center:profile.locationPoint || found[0]?.location || {lat:14.5995,lng:120.9842},zoom:12,mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',mapTypeControl:false,streetViewControl:false});
        const bounds=new google.maps.LatLngBounds();
        found.forEach(p=>{if(p.location){new AdvancedMarkerElement({map,position:p.location,title:p.displayName});bounds.extend(p.location);}});
        if(found.length) map.fitBounds(bounds);
      }
    } catch { setError('Could not load Google Places. Check API access or try again.'); }
    finally {setBusy(false);}
  }
  return <div className="local-competition"><button type="button" className="text-button" aria-expanded={open} onClick={()=>setOpen(!open)}>Local competition {open?'−':'+'}</button><div hidden={!open}><p>Possible competitors near {profile.location}. Results may extend beyond your area and are not a complete market survey.</p><Button variant="secondary" disabled={busy} onClick={()=>void find()}>{busy?'Searching…':places?'Refresh results':'Find similar businesses'}</Button>{error && <p role="alert">{error}</p>}<div className="competitor-map" ref={canvas} hidden={!places}/>{places?.length===0 && <p>No matches returned. This does not mean there is no competition.</p>}{places?.map(p=><div className="competitor-result" key={p.id}><a href={p.googleMapsURI || `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(p.displayName || '')}&query_place_id=${encodeURIComponent(p.id)}`} target="_blank" rel="noreferrer">{p.displayName}</a><p>{p.formattedAddress}</p></div>)}{places && <small>Google Maps results. Compare offers, prices and customers before drawing conclusions.</small>}</div></div>;
}
