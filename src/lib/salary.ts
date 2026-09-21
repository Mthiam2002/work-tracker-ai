// Estimation brut → net salarié non-cadre (~23 % de cotisations).
// Indicatif : le net réel dépend du statut, mutuelle, PAS, etc.
export const NET_RATIO = 0.77;

export function brutToNet(brut: number) {
  return brut * NET_RATIO;
}
