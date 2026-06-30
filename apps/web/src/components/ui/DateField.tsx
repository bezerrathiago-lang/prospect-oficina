/**
 * DateField — campo de data que aceita digitação E seletor de calendário.
 *
 * O usuário pode digitar livremente no formato DD/MM/AAAA (com máscara) ou
 * tocar no ícone de calendário para abrir o seletor nativo. O valor é sempre
 * emitido/recebido em ISO (YYYY-MM-DD), mantendo compatibilidade com as
 * validações já existentes nos formulários.
 */
import { useEffect, useRef, useState } from 'react';

interface DateFieldProps {
  id?: string;
  value: string; // ISO (YYYY-MM-DD) ou ''
  onChange: (iso: string) => void;
  onBlur?: () => void;
  min?: string; // ISO
  max?: string; // ISO
  disabled?: boolean;
  /** Classe do input de texto (preserva o estilo de cada formulário) */
  className?: string;
  placeholder?: string;
}

// ── Helpers ──────────────────────────────────────────────────────

/** ISO (YYYY-MM-DD) → BR (DD/MM/AAAA) */
function isoToBr(iso: string): string {
  if (!iso || iso.length !== 10) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

/** Aplica máscara DD/MM/AAAA sobre o texto digitado */
function maskBr(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const dd = digits.slice(0, 2);
  const mm = digits.slice(2, 4);
  const yyyy = digits.slice(4, 8);
  let out = dd;
  if (digits.length >= 3) out += `/${mm}`;
  if (digits.length >= 5) out += `/${yyyy}`;
  return out;
}

/** Verifica se ano/mês/dia formam uma data de calendário válida */
function isRealDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

/** BR (DD/MM/AAAA) → ISO (YYYY-MM-DD); '' se incompleto/ inválido */
function brToIso(br: string): string {
  const digits = br.replace(/\D/g, '');
  if (digits.length !== 8) return '';
  const d = Number(digits.slice(0, 2));
  const m = Number(digits.slice(2, 4));
  const y = Number(digits.slice(4, 8));
  if (!isRealDate(y, m, d)) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${y}-${pad(m)}-${pad(d)}`;
}

// ── Componente ───────────────────────────────────────────────────

export default function DateField({
  id,
  value,
  onChange,
  onBlur,
  min,
  max,
  disabled,
  className = '',
  placeholder = 'DD/MM/AAAA',
}: DateFieldProps) {
  const [text, setText] = useState<string>(isoToBr(value));
  const pickerRef = useRef<HTMLInputElement>(null);

  // Sincroniza o texto quando o valor externo muda (ex.: seletor de calendário),
  // sem atropelar o que o usuário está digitando.
  useEffect(() => {
    if (brToIso(text) !== value) {
      setText(isoToBr(value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  function handleText(raw: string) {
    const masked = maskBr(raw);
    setText(masked);
    onChange(brToIso(masked)); // '' enquanto incompleto/ inválido
  }

  function handlePicker(iso: string) {
    setText(isoToBr(iso));
    onChange(iso);
  }

  return (
    <div className="relative">
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={text}
        onChange={(e) => handleText(e.target.value)}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        maxLength={10}
        className={`${className} pr-10`}
      />
      {/* Botão do calendário */}
      <button
        type="button"
        onClick={() => pickerRef.current?.showPicker?.()}
        disabled={disabled}
        aria-label="Abrir calendário"
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-gray-400 hover:text-gray-600 disabled:opacity-50"
        tabIndex={-1}
      >
        <span aria-hidden="true">📅</span>
      </button>
      {/* Input nativo oculto apenas para o seletor */}
      <input
        ref={pickerRef}
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => handlePicker(e.target.value)}
        className="absolute right-0 bottom-0 h-0 w-0 opacity-0 pointer-events-none"
        tabIndex={-1}
        aria-hidden="true"
      />
    </div>
  );
}
