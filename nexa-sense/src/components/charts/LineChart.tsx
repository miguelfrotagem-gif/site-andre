import { useEffect, useId, useRef, useState } from "react";
export interface Series {
  label: string;
  color: string;
  values: number[];
}
export function LineChart({
  series,
  labels,
  unit = "",
  compact = false,
}: {
  series: Series[];
  labels: string[];
  unit?: string;
  compact?: boolean;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  useEffect(() => {
    const observer = new ResizeObserver(([entry]) =>
      setWidth(Math.max(250, Math.round(entry.contentRect.width))),
    );
    if (container.current) observer.observe(container.current);
    return () => observer.disconnect();
  }, []);
  const height = compact ? 186 : 230,
    pad = 32,
    max = Math.max(5, ...series.flatMap((s) => s.values));
  const y = (v: number) => height - pad - (v / max) * (height - pad * 2);
  const x = (i: number) =>
    pad +
    (labels.length === 1
      ? (width - pad * 2) / 2
      : (i / (labels.length - 1)) * (width - pad * 2));
  return (
    <div className="chart" ref={container}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-labelledby={`${id}-title ${id}-desc`}
      >
        <title id={`${id}-title`}>
          {series.map((s) => s.label).join(" e ")} — evolução simulada
        </title>
        <desc id={`${id}-desc`}>
          {series
            .map(
              (s) =>
                `${s.label}: ${s.values.map((v, i) => `${labels[i]}, ${v}${unit}`).join("; ")}`,
            )
            .join(". ")}
          . Linhas ligam apenas as medições disponíveis.
        </desc>
        {[0, 0.5, 1].map((r) => (
          <g key={r}>
            <line
              x1={pad}
              x2={width - pad}
              y1={y(r * max)}
              y2={y(r * max)}
              stroke="#e8edf0"
              strokeDasharray="3 5"
            />
            <text x="0" y={y(r * max) + 4} fill="#64748b" fontSize="12">
              {Math.round(r * max)}
            </text>
          </g>
        ))}
        {labels.map((label, i) => (
          <text
            key={`${label}-${i}`}
            x={x(i)}
            y={height - 6}
            textAnchor="middle"
            fill="#64748b"
            fontSize="12"
          >
            {label}
          </text>
        ))}
        {series.map((s, index) => (
          <g key={s.label}>
            <polyline
              points={s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ")}
              fill="none"
              stroke={s.color}
              strokeWidth="2.5"
              strokeLinejoin="round"
              strokeDasharray={index === 1 ? "5 4" : undefined}
            />
            {s.values.map((v, i) => (
              <circle
                key={i}
                cx={x(i)}
                cy={y(v)}
                r="4"
                fill="white"
                stroke={s.color}
                strokeWidth="2"
              >
                <title>
                  {labels[i]}: {v}
                  {unit}
                </title>
              </circle>
            ))}
          </g>
        ))}
      </svg>
      <div className="chart-legend">
        {series.map((s, i) => (
          <span key={s.label}>
            <i
              style={{ background: s.color }}
              className={i === 1 ? "dashed" : ""}
            />
            {s.label}
          </span>
        ))}
      </div>
    </div>
  );
}
