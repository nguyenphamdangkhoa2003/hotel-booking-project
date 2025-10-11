import { randomBytes, createHash } from 'crypto';
import * as argon2 from 'argon2';

export async function hashToken(raw: string) {
  return await argon2.hash(raw);
}
