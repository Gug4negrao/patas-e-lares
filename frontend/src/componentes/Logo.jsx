// Marca do Patas & Lares: uma casa (lar) com uma pegada (patas) dentro.
// O mesmo desenho está em public/favicon.svg.
export function Marca({ tamanho = 36 }) {
  return (
    <svg
      className="marca-icone"
      width={tamanho}
      height={tamanho}
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path
        d="M24 4.5 44.5 21.2V40a4 4 0 0 1-4 4h-33a4 4 0 0 1-4-4V21.2Z"
        fill="var(--cor-principal)"
        stroke="var(--cor-principal)"
        strokeWidth="3"
        strokeLinejoin="round"
      />
      <g fill="var(--cor-fundo)">
        <ellipse cx="24" cy="34" rx="7.2" ry="5.6" />
        <ellipse cx="14.8" cy="26.4" rx="2.6" ry="3.2" transform="rotate(-20 14.8 26.4)" />
        <ellipse cx="20.2" cy="21.8" rx="2.7" ry="3.4" transform="rotate(-6 20.2 21.8)" />
        <ellipse cx="27.8" cy="21.8" rx="2.7" ry="3.4" transform="rotate(6 27.8 21.8)" />
        <ellipse cx="33.2" cy="26.4" rx="2.6" ry="3.2" transform="rotate(20 33.2 26.4)" />
      </g>
    </svg>
  )
}

export default function Logo({ tamanho }) {
  return (
    <span className="logo">
      <Marca tamanho={tamanho} />
      <span className="logo-nome">
        Patas <span className="logo-e">&amp;</span> Lares
      </span>
    </span>
  )
}
