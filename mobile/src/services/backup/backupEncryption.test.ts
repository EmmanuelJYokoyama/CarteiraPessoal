import {decryptBackup, encryptBackup, serializeBackupEnvelope, BackupError} from './backupEncryption';

describe('backupEncryption', () => {
  const password = 'SenhaForte#2026';
  const payload = {
    user: {
      name: 'Emmanuel',
      email: 'emmanuel@example.com',
    },
    goals: [
      {
        id: 'goal-1',
        name: 'Reserva',
        target: 10000,
      },
    ],
    cache: {
      transactions: 12,
    },
  };

  it('encrypts and decrypts a backup payload end to end', () => {
    const encrypted = encryptBackup(payload, password, {
      metadata: {source: 'local', appVersion: '1.0.0'},
      iterations: 5000,
    });

    const serialized = serializeBackupEnvelope(encrypted);
    expect(serialized).toContain('carteira-pessoal-backup-v1');

    const decrypted = decryptBackup<typeof payload>(serialized, password);

    expect(decrypted).toEqual(payload);
  });

  it('rejects an incorrect password', () => {
    const encrypted = encryptBackup(payload, password, {iterations: 5000});

    expect(() => decryptBackup(encrypted, 'senha-errada')).toThrow(BackupError);
    expect(() => decryptBackup(encrypted, 'senha-errada')).toThrow(/integrity check failed/i);
  });

  it('rejects tampered ciphertext', () => {
    const encrypted = encryptBackup(payload, password, {iterations: 5000});
    const tampered = {
      ...encrypted,
      ciphertext: `${encrypted.ciphertext.slice(0, -4)}ABCD`,
    };

    expect(() => decryptBackup(tampered, password)).toThrow(/integrity check failed/i);
  });
});
