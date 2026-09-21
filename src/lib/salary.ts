// Estimation brut → net salarié (part conservée après cotisations).
// Indicatif : le net réel dépend du statut, mutuelle, PAS, etc.
// Défaut non-cadre ≈ 0.77, modifiable par utilisateur dans /settings.
export const DEFAULT_NET_RATIO = 0.77;

export function brutToNet(brut: number, ratio: number = DEFAULT_NET_RATIO) {
  return brut * ratio;
}

export function netPctLabel(ratio: number) {
  return `${Math.round((1 - ratio) * 100)} %`;
}
