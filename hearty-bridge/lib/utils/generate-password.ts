import { randomInt } from 'crypto';

/**
 * Karakter yang dipakai untuk password sementara. Huruf/angka yang gampang
 * ketuker saat dibacakan ke user lewat telepon atau chat (0/O, 1/l/I) sengaja
 * dibuang, karena password ini memang untuk diteruskan manual oleh admin.
 */
const LOWER = 'abcdefghijkmnpqrstuvwxyz';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
const DIGIT = '23456789';
const SYMBOL = '!@#$%&*?';
const ALL = LOWER + UPPER + DIGIT + SYMBOL;

function pick(pool: string): string {
  return pool[randomInt(pool.length)];
}

/**
 * Bikin password sementara acak yang dijamin punya minimal satu huruf kecil,
 * huruf besar, angka, dan simbol — supaya selalu lolos aturan panjang minimal
 * 8 karakter di schema User dan cukup kuat untuk dipakai sekali.
 */
export function generateTempPassword(length = 12): string {
  const min = 8;
  const size = Math.max(min, length);

  const chars = [pick(LOWER), pick(UPPER), pick(DIGIT), pick(SYMBOL)];
  while (chars.length < size) {
    chars.push(pick(ALL));
  }

  // Fisher-Yates pakai randomInt supaya posisi karakter wajib tidak ketebak.
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join('');
}
