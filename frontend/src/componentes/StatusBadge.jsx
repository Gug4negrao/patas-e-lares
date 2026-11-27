// Selo colorido com a situação da solicitação (cores em estilos.css: .selo-Pendente etc.).
export default function StatusBadge({ status }) {
  return <span className={`selo selo-${status}`}>{status}</span>
}
