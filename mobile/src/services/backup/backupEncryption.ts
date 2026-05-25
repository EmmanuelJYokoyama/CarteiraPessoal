import CryptoJS from 'crypto-js';
import {z} from 'zod';

const BACKUP_FORMAT = 'carteira-pessoal-backup-v1';
const BACKUP_ALGORITHM = 'AES-256-CBC';
const BACKUP_KDF = 'PBKDF2-SHA256';
const DEFAULT_ITERATIONS = 210000;
const SALT_BYTES = 16;
const IV_BYTES = 16;
const AES_KEY_BYTES = 32;
const HMAC_KEY_BYTES = 32;
const DERIVED_KEY_BYTES = AES_KEY_BYTES + HMAC_KEY_BYTES;

export type BackupMetadata = Record<string, unknown>;

export type BackupEnvelope<TPayload = unknown> = {
  format: typeof BACKUP_FORMAT;
  algorithm: typeof BACKUP_ALGORITHM;
  kdf: typeof BACKUP_KDF;
  iterations: number;
  salt: string;
  iv: string;
  ciphertext: string;
  mac: string;
  createdAt: string;
  payloadType: string;
  metadata?: BackupMetadata;
};

const backupEnvelopeSchema = z.object({
  format: z.literal(BACKUP_FORMAT),
  algorithm: z.literal(BACKUP_ALGORITHM),
  kdf: z.literal(BACKUP_KDF),
  iterations: z.number().int().positive(),
  salt: z.string().min(1),
  iv: z.string().min(1),
  ciphertext: z.string().min(1),
  mac: z.string().min(1),
  createdAt: z.string().datetime(),
  payloadType: z.string().min(1),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export class BackupError extends Error {
  constructor(
    public readonly code:
      | 'BACKUP_INVALID_ARGUMENT'
      | 'BACKUP_INVALID_FORMAT'
      | 'BACKUP_INTEGRITY_ERROR'
      | 'BACKUP_DECRYPTION_ERROR',
    message: string,
  ) {
    super(message);
    this.name = 'BackupError';
  }
}

function randomWordArray(byteLength: number): CryptoJS.lib.WordArray {
  return CryptoJS.lib.WordArray.random(byteLength);
}

function toBase64(wordArray: CryptoJS.lib.WordArray): string {
  return CryptoJS.enc.Base64.stringify(wordArray);
}

function fromBase64(value: string): CryptoJS.lib.WordArray {
  return CryptoJS.enc.Base64.parse(value);
}

function sliceWordArray(
  source: CryptoJS.lib.WordArray,
  startByte: number,
  byteLength: number,
): CryptoJS.lib.WordArray {
  const startWord = Math.floor(startByte / 4);
  const endByte = startByte + byteLength;
  const endWord = Math.ceil(endByte / 4);
  const words = source.words.slice(startWord, endWord);
  return CryptoJS.lib.WordArray.create(words, byteLength);
}

function normalizePassword(password: string): string {
  if (typeof password !== 'string' || password.trim().length === 0) {
    throw new BackupError('BACKUP_INVALID_ARGUMENT', 'Password must not be empty');
  }

  return password;
}

function deriveKeyMaterial(
  password: string,
  salt: CryptoJS.lib.WordArray,
  iterations: number,
): CryptoJS.lib.WordArray {
  if (!Number.isInteger(iterations) || iterations < 1) {
    throw new BackupError('BACKUP_INVALID_ARGUMENT', 'Iterations must be a positive integer');
  }

  return CryptoJS.PBKDF2(password, salt, {
    keySize: DERIVED_KEY_BYTES / 4,
    iterations,
    hasher: CryptoJS.algo.SHA256,
  });
}

function buildMacInput(envelope: Omit<BackupEnvelope, 'mac' | 'payload'>): string {
  return [
    envelope.format,
    envelope.algorithm,
    envelope.kdf,
    String(envelope.iterations),
    envelope.salt,
    envelope.iv,
    envelope.ciphertext,
    envelope.createdAt,
    envelope.payloadType,
    JSON.stringify(envelope.metadata ?? {}),
  ].join('|');
}

function createMac(
  envelope: Omit<BackupEnvelope, 'mac' | 'payload'>,
  hmacKey: CryptoJS.lib.WordArray,
): string {
  return CryptoJS.HmacSHA256(buildMacInput(envelope), hmacKey).toString(CryptoJS.enc.Base64);
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }

  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) {
    mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }

  return mismatch === 0;
}

function parseEnvelope(input: string | BackupEnvelope): BackupEnvelope {
  const raw = typeof input === 'string' ? JSON.parse(input) : input;
  const parsed = backupEnvelopeSchema.safeParse(raw);

  if (!parsed.success) {
    throw new BackupError('BACKUP_INVALID_FORMAT', 'Backup file format is invalid');
  }

  return parsed.data;
}

function inferPayloadType(payload: unknown): string {
  if (payload === null) {
    return 'null';
  }

  if (Array.isArray(payload)) {
    return 'array';
  }

  return typeof payload;
}

/**
 * Derives a 64-byte key bundle from the user password using PBKDF2-SHA256.
 * The first 32 bytes are used for AES-256 and the remaining 32 bytes for HMAC.
 */
export function generateKeyFromPassword(
  password: string,
  salt: string,
  iterations: number = DEFAULT_ITERATIONS,
): {encryptionKey: CryptoJS.lib.WordArray; integrityKey: CryptoJS.lib.WordArray} {
  const normalizedPassword = normalizePassword(password);
  const saltWordArray = fromBase64(salt);
  const derivedMaterial = deriveKeyMaterial(normalizedPassword, saltWordArray, iterations);

  return {
    encryptionKey: sliceWordArray(derivedMaterial, 0, AES_KEY_BYTES),
    integrityKey: sliceWordArray(derivedMaterial, AES_KEY_BYTES, HMAC_KEY_BYTES),
  };
}

/**
 * Encrypts a backup payload into a self-contained JSON envelope.
 * The output is safe to write to local storage or upload to cloud storage.
 */
export function encryptBackup<TPayload extends Record<string, unknown> | unknown[]>(
  payload: TPayload,
  password: string,
  options?: {
    iterations?: number;
    metadata?: BackupMetadata;
  },
): BackupEnvelope<TPayload> {
  const normalizedPassword = normalizePassword(password);
  const iterations = options?.iterations ?? DEFAULT_ITERATIONS;
  const salt = randomWordArray(SALT_BYTES);
  const iv = randomWordArray(IV_BYTES);
  const saltBase64 = toBase64(salt);
  const ivBase64 = toBase64(iv);
  const keys = generateKeyFromPassword(normalizedPassword, saltBase64, iterations);
  const payloadJson = JSON.stringify(payload);

  const ciphertext = CryptoJS.AES.encrypt(payloadJson, keys.encryptionKey, {
    iv,
    mode: CryptoJS.mode.CBC,
    padding: CryptoJS.pad.Pkcs7,
  }).toString();

  const envelopeWithoutMac: Omit<BackupEnvelope<TPayload>, 'mac' | 'payload'> = {
    format: BACKUP_FORMAT,
    algorithm: BACKUP_ALGORITHM,
    kdf: BACKUP_KDF,
    iterations,
    salt: saltBase64,
    iv: ivBase64,
    ciphertext,
    createdAt: new Date().toISOString(),
    payloadType: inferPayloadType(payload),
    metadata: options?.metadata,
  };

  return {
    ...envelopeWithoutMac,
    mac: createMac(envelopeWithoutMac, keys.integrityKey),
  };
}

/**
 * Decrypts and validates a backup envelope.
 * A MAC mismatch is treated as either a wrong password or a tampered backup.
 */
export function decryptBackup<TPayload>(
  input: string | BackupEnvelope,
  password: string,
): TPayload {
  const normalizedPassword = normalizePassword(password);
  const envelope = parseEnvelope(input);
  const keys = generateKeyFromPassword(normalizedPassword, envelope.salt, envelope.iterations);
  const envelopeWithoutMac: Omit<BackupEnvelope<TPayload>, 'mac' | 'payload'> = {
    format: envelope.format,
    algorithm: envelope.algorithm,
    kdf: envelope.kdf,
    iterations: envelope.iterations,
    salt: envelope.salt,
    iv: envelope.iv,
    ciphertext: envelope.ciphertext,
    createdAt: envelope.createdAt,
    payloadType: envelope.payloadType,
    metadata: envelope.metadata,
  };

  const expectedMac = createMac(envelopeWithoutMac, keys.integrityKey);

  if (!timingSafeEqual(envelope.mac, expectedMac)) {
    throw new BackupError(
      'BACKUP_INTEGRITY_ERROR',
      'Backup integrity check failed. The password may be incorrect or the file may be corrupted.',
    );
  }

  try {
    const decrypted = CryptoJS.AES.decrypt(envelope.ciphertext, keys.encryptionKey, {
      iv: fromBase64(envelope.iv),
      mode: CryptoJS.mode.CBC,
      padding: CryptoJS.pad.Pkcs7,
    });

    const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
    if (!plaintext) {
      throw new Error('Empty plaintext');
    }

    return JSON.parse(plaintext) as TPayload;
  } catch (error) {
    if (error instanceof BackupError) {
      throw error;
    }

    throw new BackupError(
      'BACKUP_DECRYPTION_ERROR',
      'Unable to decrypt backup payload. The file may be damaged.',
    );
  }
}

export function serializeBackupEnvelope<TPayload>(envelope: BackupEnvelope<TPayload>): string {
  return JSON.stringify(envelope);
}

export function deserializeBackupEnvelope(input: string): BackupEnvelope {
  return parseEnvelope(input);
}
