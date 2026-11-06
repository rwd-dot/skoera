// Bygdir við kommunu. Brúkt til at seta kommunu á eina fráboðan út frá GPS (næsta bygd).
// Listin er ikki fullfíggjaður: legg bygdir afturat, um kommunur verða skeivar.
export const TOWNS = [
  ['Tórshavn', 62.011, -6.771, 'Tórshavnar kommuna'], ['Hoyvík', 62.03, -6.757, 'Tórshavnar kommuna'],
  ['Argir', 61.995, -6.775, 'Tórshavnar kommuna'], ['Kirkjubøur', 61.955, -6.792, 'Tórshavnar kommuna'],
  ['Hvítanes', 62.05, -6.755, 'Tórshavnar kommuna'], ['Kaldbak', 62.061, -6.82, 'Tórshavnar kommuna'],
  ['Kollafjørður', 62.113, -6.917, 'Tórshavnar kommuna'], ['Hoyvíkshagi', 62.02, -6.79, 'Tórshavnar kommuna'],
  ['Nólsoy', 62.007, -6.667, 'Tórshavnar kommuna'], ['Hestur', 61.958, -6.883, 'Tórshavnar kommuna'],
  ['Klaksvík', 62.226, -6.589, 'Klaksvíkar kommuna'], ['Árnafjørður', 62.255, -6.54, 'Klaksvíkar kommuna'],
  ['Runavík', 62.108, -6.721, 'Runavíkar kommuna'], ['Glyvrar', 62.125, -6.73, 'Runavíkar kommuna'],
  ['Saltangará', 62.115, -6.72, 'Runavíkar kommuna'], ['Æðuvík', 62.07, -6.69, 'Runavíkar kommuna'],
  ['Strendur', 62.114, -6.757, 'Sjóvar kommuna'], ['Selatrað', 62.15, -6.85, 'Sjóvar kommuna'],
  ['Gøta', 62.19, -6.74, 'Eystur kommuna'], ['Leirvík', 62.21, -6.70, 'Eystur kommuna'],
  ['Fuglafjørður', 62.244, -6.814, 'Fuglafjarðar kommuna'], ['Eiði', 62.299, -7.09, 'Eiðis kommuna'],
  ['Sunda', 62.17, -7.0, 'Sunda kommuna'], ['Hósvík', 62.155, -6.93, 'Sunda kommuna'], ['Hvalvík', 62.19, -7.01, 'Sunda kommuna'],
  ['Vestmanna', 62.156, -7.169, 'Vestmanna kommuna'], ['Kvívík', 62.12, -7.07, 'Kvívíkar kommuna'],
  ['Sørvágur', 62.072, -7.306, 'Vága kommuna'], ['Miðvágur', 62.051, -7.19, 'Vága kommuna'], ['Sandavágur', 62.054, -7.152, 'Vága kommuna'],
  ['Sandur', 61.833, -6.81, 'Sands kommuna'], ['Skopun', 61.905, -6.88, 'Skopunar kommuna'], ['Skúvoy', 61.77, -6.82, 'Skúvoyar kommuna'],
  ['Tvøroyri', 61.556, -6.807, 'Tvøroyrar kommuna'], ['Hvalba', 61.6, -6.95, 'Hvalbiar kommuna'], ['Vágur', 61.473, -6.81, 'Vágs kommuna'],
  ['Porkeri', 61.48, -6.75, 'Porkeris kommuna'], ['Hov', 61.505, -6.76, 'Hovs kommuna'], ['Fámjin', 61.53, -6.875, 'Fámjins kommuna'],
  ['Sumba', 61.405, -6.71, 'Sumbiar kommuna'], ['Húsar', 62.26, -6.68, 'Húsa kommuna'], ['Kunoy', 62.29, -6.67, 'Kunoyar kommuna'],
  ['Viðareiði', 62.36, -6.53, 'Viðareiðis kommuna'], ['Hvannasund', 62.29, -6.52, 'Hvannasunds kommuna'],
  ['Fugloy', 62.33, -6.31, 'Fugloyar kommuna'], ['Sjóvar', 62.13, -6.80, 'Sjóvar kommuna'],
];

export function nearestKommuna(lat, lon) {
  if (lat == null || lon == null) return null;
  let best = null, bd = Infinity;
  for (const t of TOWNS) {
    const d = (t[1] - lat) ** 2 + ((t[2] - lon) * 0.47) ** 2;
    if (d < bd) { bd = d; best = t; }
  }
  return best ? best[3] : null;
}
