// auth/utils/otp.ts
import { randomInt } from 'crypto';
import * as argon2 from 'argon2';

export function generateOtp6() {
  // 6 chữ số, luôn đủ 6 ký tự (000123)
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function hashOtp(code: string) {
  return argon2.hash(code);
}
