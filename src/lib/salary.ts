// Estimation brut → net salarié (part conservée après cotisations).
// Indicatif : le net réel dépend du statut, mutuelle, PAS, etc.
// Référence réelle octobre 2026 : 0,78 (net social / brut, bulletin JDM Sécurité).
export const DEFAULT_NET_RATIO = 0.78;

export function brutToNet(brut: number, ratio: number = DEFAULT_NET_RATIO) {
  return brut * ratio;
}

export function netPctLabel(ratio: number) {
  return `${Math.round((1 - ratio) * 100)} %`;
}
