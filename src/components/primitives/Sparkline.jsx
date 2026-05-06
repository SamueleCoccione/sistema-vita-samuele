import { useId } from 'react';
import {
  AreaChart, Area,
  LineChart, Line,
  BarChart, Bar,
  ResponsiveContainer,
} from 'recharts';

export default function Sparkline({ data = [], accent = 'var(--color-teal)', variant = 'area', height = 32 }) {
  const uid = useId().replace(/:/g, '');
  const chartData = data.map((v, i) => ({ i, v }));

  if (chartData.length < 2) return null;

  if (variant === 'bars') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
          <Bar dataKey="v" fill={accent} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    );
  }

  if (variant === 'line') {
    return (
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <Line
            type="monotone" dataKey="v"
            stroke={accent} strokeWidth={1.5}
            dot={false} isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={`sp-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={accent} stopOpacity={0.25} />
            <stop offset="95%" stopColor={accent} stopOpacity={0.03} />
          </linearGradient>
        </defs>
        <Area
          type="monotone" dataKey="v"
          stroke={accent} strokeWidth={1.5}
          fill={`url(#sp-${uid})`}
          dot={false} isAnimationActive={false}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
