/**
 * PieChart — gráfico de pizza simples (CSS conic-gradient + legenda)
 */
interface Slice {
  label: string;
  count: number;
}

const COLORS = ['#E1251B', '#4B4F54', '#16A34A', '#F59E0B', '#2563EB', '#9333EA'];

export default function PieChart({ data }: { data: Slice[] }) {
  const total = data.reduce((sum, s) => sum + s.count, 0);
  if (total === 0) return null;

  // monta os stops do conic-gradient
  let acc = 0;
  const stops = data.map((s, i) => {
    const start = (acc / total) * 360;
    acc += s.count;
    const end = (acc / total) * 360;
    return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
  });

  return (
    <div className="flex items-center gap-5 flex-wrap">
      <div
        className="h-32 w-32 shrink-0 rounded-full"
        style={{ background: `conic-gradient(${stops.join(', ')})` }}
        role="img"
        aria-label="Gráfico de pizza dos cenários"
      />
      <ul className="flex flex-col gap-2 text-sm">
        {data.map((s, i) => {
          const pct = Math.round((s.count / total) * 100);
          return (
            <li key={s.label} className="flex items-center gap-2">
              <span
                className="inline-block h-3 w-3 rounded-sm shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-gray-700">{s.label}</span>
              <span className="font-semibold text-gray-900">
                {s.count} ({pct}%)
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
