import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function StatCard({ icon, label, value, trend, trendLabel, accent = '#7c3aed', sublabel }) {
  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'var(--green)' : trend === 'down' ? 'var(--red)' : 'var(--text-muted)';

  return (
    <div className="glass-card" style={{ padding: '22px 24px', position: 'relative', overflow: 'hidden' }}>
      {/* Background glow */}
      <div style={{
        position: 'absolute', top: -20, right: -20,
        width: 100, height: 100,
        background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 42, height: 42,
          borderRadius: 12,
          background: `${accent}20`,
          border: `1px solid ${accent}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 20,
        }}>
          {icon}
        </div>
        {trendLabel && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: '0.72rem', fontWeight: 600, color: trendColor,
            background: `${trendColor}15`,
            border: `1px solid ${trendColor}25`,
            padding: '3px 8px', borderRadius: 'var(--radius-full)',
          }}>
            <TrendIcon size={11} />
            {trendLabel}
          </div>
        )}
      </div>

      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
        {label}
      </div>
      <div style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.03em', lineHeight: 1 }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: 6 }}>{sublabel}</div>
      )}
    </div>
  );
}
