export function replaceBusinessName(text: string, previous: string, next: string) {
 if (!previous.trim() || previous === next) return text;
 const pattern=previous.trim().split(/\s+/).map(part=>part.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).join('\\s+');
 return text.replace(new RegExp(pattern,'gi'),()=>next);
}
