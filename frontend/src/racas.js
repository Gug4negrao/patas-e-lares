// Funções usadas pelas telas do catálogo de raças.

// Compara textos sem diferenciar maiúsculas nem acentos ("Cão" == "cao").
export function normalizar(texto) {
  return (texto ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()
}

// "Friendly, gentle, alert" -> ['Friendly', 'gentle', 'alert']
export function temperamentos(raca) {
  return (raca?.temperamento ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
}
