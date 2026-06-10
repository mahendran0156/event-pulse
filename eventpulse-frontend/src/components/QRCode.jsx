export default function QRCode({ token }) {
  if (!token) return null;
  // Deterministic cell pattern from token string
  const cells = Array.from({ length: 196 }, (_, i) => {
    const c = token.charCodeAt(i % token.length);
    return (c * (i + 13)) % 3 === 0;
  });
  return (
    <div className="qr-grid">
      {cells.map((filled, i) => (
        <div
          key={i}
          className="qr-cell"
          style={{ background: filled ? "var(--gold)" : "rgba(255,255,255,0.04)" }}
        />
      ))}
    </div>
  );
}
