// All overlays share one lock so closing them in any order restores scrolling.
const locks = new Set<symbol>();
let originalOverflow = "";

export function lockPageScroll() {
  const token = Symbol("overlay");
  if (locks.size === 0) originalOverflow = document.body.style.overflow;
  locks.add(token);
  document.body.style.overflow = "hidden";
  return () => {
    if (!locks.delete(token)) return;
    if (locks.size === 0) document.body.style.overflow = originalOverflow;
  };
}
