export default function ProgressBar({ percent = 0, color, height = 6, showLabel = false, animated = true }) {
  const pct = Math.min(100, Math.max(0, percent));
  const barColor = color || (pct >= 90 ? 'var(--red)' : pct >= 70 ? 'var(--amber)' : 'var(--green)');
  const bgColor = color
    ? `${color}20`
    : pct >= 90 ? 'var(--red-dim)' : pct >= 70 ? 'var(--amber-dim)' : 'var(--green-dim)';

  return (
    <div style={{ width: '100%' }}>
      {showLabel && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 4 }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 600, color: barColor }}>{pct.toFixed(0)}%</span>
        </div>
      )}
      <div style={{
        width: '100%', height, borderRadius: 999,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          background: barColor,
          borderRadius: 999,
          transition: animated ? 'width 0.6s cubic-bezier(0.4, 0, 0.2, 1)' : 'none',
          boxShadow: `0 0 8px ${barColor}60`,
        }} />
      </div>
    </div>
  );
}
