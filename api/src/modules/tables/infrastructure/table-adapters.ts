import { randomInt } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { QR_TOKEN_ALPHABET, QR_TOKEN_LENGTH } from '../domain/qr-credential.js';
import type { TableActivitySnapshot } from '../domain/table.js';
import type { QrTokenGenerator, TableActivity } from '../domain/tables-configuration.js';

/** Uniform, cryptographically secure 10-character alphanumeric tokens. */
@Injectable()
export class CryptoQrTokenGenerator implements QrTokenGenerator {
  generate(): string {
    let token = '';
    for (let index = 0; index < QR_TOKEN_LENGTH; index += 1) token += QR_TOKEN_ALPHABET[randomInt(QR_TOKEN_ALPHABET.length)];
    return token;
  }
}

/** Table sessions do not exist in the API yet, so no table has activity. Replace when they do. */
@Injectable()
export class NoTableActivity implements TableActivity {
  activityOf(_tableId: string): Promise<TableActivitySnapshot> {
    return Promise.resolve({ openSession: false, hadSession: false });
  }
}
