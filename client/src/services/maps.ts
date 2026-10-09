/// <reference types="google.maps" />
let pending: Promise<void> | undefined;
export function loadMaps() {
  if (pending) return pending;
  pending = new Promise<void>((resolve, reject) => {
    const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!key) { reject(new Error('Maps is not configured. Location selection is currently unavailable.')); return; }
    const script = document.createElement('script');
    const callback = '__bizZMapsReady';
    const scope = window as unknown as Record<string, unknown>;
    scope.gm_authFailure = () => window.dispatchEvent(new Event('bizz-maps-auth-error'));
    const timer = window.setTimeout(() => fail(), 20000);
    const fail = () => { clearTimeout(timer); script.remove(); delete scope[callback]; reject(new Error('Maps could not load. Check the key restrictions and enabled APIs.')); };
    scope[callback] = () => { clearTimeout(timer); delete scope[callback]; resolve(); };
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&v=weekly&callback=${callback}`;
    script.async = true;
    script.onerror = fail;
    document.head.appendChild(script);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}
