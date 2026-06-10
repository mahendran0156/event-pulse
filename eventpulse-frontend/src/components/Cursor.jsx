import { useEffect, useRef } from "react";

export default function Cursor() {
  const dot  = useRef(null);
  const ring = useRef(null);

  useEffect(() => {
    let mx = 0, my = 0, rx = 0, ry = 0, af;

    const onMove = e => {
      mx = e.clientX; my = e.clientY;
      if (dot.current) {
        dot.current.style.left = mx + "px";
        dot.current.style.top  = my + "px";
      }
    };

    const animate = () => {
      rx += (mx - rx) * 0.11;
      ry += (my - ry) * 0.11;
      if (ring.current) {
        ring.current.style.left = rx + "px";
        ring.current.style.top  = ry + "px";
      }
      af = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove);
    af = requestAnimationFrame(animate);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(af); };
  }, []);

  return (
    <>
      <div ref={dot}  className="cur-dot"  />
      <div ref={ring} className="cur-ring" />
    </>
  );
}
