import { createCipheriv, createDecipheriv } from 'crypto';

const key = Buffer.from('your-32-byte-key-here', 'utf8'); // Replace with a secure key
const iv = Buffer.from('your-16-byte-iv-here', 'utf8');  // Replace with a secure IV

export function encrypt(text: string): string {
  const cipher = createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function decrypt(encrypted: string): string {
  const decipher = createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
