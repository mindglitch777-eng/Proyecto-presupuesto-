type P = { className?: string; size?: number };
const base = (size: number) => ({ width: size, height: size, viewBox: "0 0 24 24", fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const, "aria-hidden": true });

export const Tilde = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className} stroke="#16794A" strokeWidth={2.5}><path d="M5 12l5 5 9-10" /></svg>
);
export const Microfono = ({ size = 22 }: P) => (
  <svg {...base(size)} stroke="#16794A" strokeWidth={2}><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 10a7 7 0 0 0 14 0M12 17v5" /></svg>
);
export const Persona = ({ size = 22 }: P) => (
  <svg {...base(size)} stroke="#16794A" strokeWidth={2}><circle cx="9" cy="8" r="3.5" /><path d="M3 20a6 6 0 0 1 12 0M17 11h4M19 9v4" /></svg>
);
export const Camara = ({ size = 22 }: P) => (
  <svg {...base(size)} stroke="#B26B00" strokeWidth={2}><rect x="3" y="6" width="18" height="14" rx="2" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6l1.5-2h5L16 6" /></svg>
);
export const Caja = ({ size = 22, color = "#F5A524", sw = 2 }: P & { color?: string; sw?: number }) => (
  <svg {...base(size)} stroke={color} strokeWidth={sw}><path d="M3 7l9-4 9 4v10l-9 4-9-4z" /><path d="M3 7l9 4 9-4M12 11v10" /></svg>
);
export const Subida = ({ size = 16 }: P) => (
  <svg {...base(size)} stroke="#B26B00" strokeWidth={2.2}><path d="M3 17l6-6 4 4 8-8M15 7h6v6" /></svg>
);
export const Escudo = ({ size = 20 }: P) => (
  <svg {...base(size)} stroke="#16794A" strokeWidth={2}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M8.5 12l2.5 2.5 4.5-5" /></svg>
);

export function Logo({ size = 34 }: P) {
  return (
    <svg width={size} height={size} viewBox="0 0 34 34" aria-hidden="true">
      <rect width="34" height="34" rx="9" fill="#0E3B2A" />
      <path d="M6 9h22v5H6z" fill="#FBF6EA" />
      <path d="M6 9h5.5v5H6zM17 9h5.5v5H17z" fill="#F5A524" />
      <path d="M6 14a2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0 2.75 2.75 0 0 0 5.5 0" fill="#FBF6EA" />
      <path d="M10 25l5-5 3.5 3 6-6.5" stroke="#F5A524" strokeWidth={2.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
