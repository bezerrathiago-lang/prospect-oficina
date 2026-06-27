/**
 * Logo — marca Cirne Motos (SVG inline, escalável)
 *
 * Ícone: disco vermelho com listras brancas (efeito de movimento)
 * Wordmark: "CIRNE" (grafite) + "MOTOS" (vermelho)
 */
interface LogoProps {
  /** altura do ícone em px */
  size?: number;
  /** mostra o wordmark ao lado do ícone */
  withWordmark?: boolean;
  /** layout vertical (ícone em cima, texto embaixo) */
  stacked?: boolean;
  /** cor do wordmark "CIRNE" (em fundo escuro use 'light') */
  variant?: 'dark' | 'light';
}

const RED = '#E1251B';
const GRAPHITE = '#4B4F54';

function Mark({ size = 40 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <clipPath id="cirne-disc">
          <circle cx="32" cy="32" r="30" />
        </clipPath>
      </defs>
      <circle cx="32" cy="32" r="30" fill={RED} />
      {/* listras brancas inclinadas no lado direito (movimento) */}
      <g clipPath="url(#cirne-disc)">
        <rect x="30" y="-6" width="4.5" height="76" transform="rotate(10 32 32)" fill="#fff" />
        <rect x="40" y="-6" width="4.5" height="76" transform="rotate(10 32 32)" fill="#fff" />
        <rect x="50" y="-6" width="4.5" height="76" transform="rotate(10 32 32)" fill="#fff" />
      </g>
    </svg>
  );
}

export default function Logo({
  size = 40,
  withWordmark = true,
  stacked = false,
  variant = 'dark',
}: LogoProps) {
  const cirneColor = variant === 'light' ? '#FFFFFF' : GRAPHITE;

  if (!withWordmark) return <Mark size={size} />;

  return (
    <div
      className={stacked ? 'flex flex-col items-center gap-2' : 'flex items-center gap-2.5'}
    >
      <Mark size={size} />
      <div
        className="leading-none font-extrabold tracking-tight"
        style={{ fontSize: size * 0.55 }}
      >
        <span style={{ color: cirneColor }}>CIRNE</span>
        <span style={{ color: RED }}> MOTOS</span>
      </div>
    </div>
  );
}
