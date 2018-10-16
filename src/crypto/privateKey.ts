/*
 * Copyright (C) 2018 Matus Zamborsky & The ontology Authors
 * This file is part of The ontology library.
 *
 * The ontology is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * The ontology is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 *
 * You should have received a copy of the GNU Lesser General Public License
 * along with The ontology.  If not, see <http://www.gnu.org/licenses/>.
 */

import * as elliptic from 'elliptic';
import { TracedError } from '../common/error';
import { Key } from './key';
import { KeyType } from './keyType';
import { PublicKey } from './publicKey';
import { Signable } from './signable';
import { Signature } from './signature';
import { SignatureScheme } from './signatureScheme';

export class PrivateKey extends Key {
  /**
   * Derives Public key out of Private key.
   */
  getPublicKey(): PublicKey {
    switch (this.algorithm) {
      case KeyType.ECDSA:
        return this.getEcDSAPublicKey();
      case KeyType.EDDSA:
        return this.getEdDSAPublicKey();
      default:
        throw new TracedError('Unsupported signature schema.');
    }
  }

  /**
   * Signs the data with supplied private key using signature schema.
   *
   * If the signature schema is not provided, the default schema for this key type is used.
   *
   * This method is not suitable, if external keys (Ledger, TPM, ...) support is required.
   *
   * @param msg Hex encoded input data or Signable object
   * @param schema Signing schema to use
   * @param publicKeyId Id of public key
   */
  sign(msg: Buffer | Signable, schema?: SignatureScheme): Signature {
    if (schema === undefined) {
      schema = this.algorithm.defaultSchema;
    }

    if (!this.isSchemaSupported(schema)) {
      throw new TracedError('Signature schema does not match key type.');
    }

    // retrieves content to sign if not provided directly
    if (!(msg instanceof Buffer)) {
      msg = msg.getSignContent();
    }

    const hash = this.computeHash(msg, schema);

    const signed = this.computeSignature(hash, schema);
    return new Signature(schema, signed);
  }

  /**
   * Computes signature of message hash using specified signature schema.
   *
   * @param hash Message hash
   * @param schema Signature schema to use
   */
  private computeSignature(hash: Buffer, schema: SignatureScheme): Buffer {
    switch (schema) {
      case SignatureScheme.ECDSAwithSHA224:
      case SignatureScheme.ECDSAwithSHA256:
      case SignatureScheme.ECDSAwithSHA384:
      case SignatureScheme.ECDSAwithSHA512:
      case SignatureScheme.ECDSAwithSHA3_224:
      case SignatureScheme.ECDSAwithSHA3_256:
      case SignatureScheme.ECDSAwithSHA3_384:
      case SignatureScheme.ECDSAwithSHA3_512:
      case SignatureScheme.ECDSAwithRIPEMD160:
        return this.computeEcDSASignature(hash);
      case SignatureScheme.EDDSAwithSHA512:
        return this.computeEdDSASignature(hash);
      default:
        throw new TracedError('Unsupported signature schema.');
    }
  }

  /**
   * Computes EcDSA signature of message hash. Curve name is derrived from private key.
   *
   * @param hash Message hash
   */
  private computeEcDSASignature(hash: Buffer): Buffer {
    const ec = new elliptic.ec(this.parameters.curve.preset);
    const signed = ec.sign(hash, this.key, { canonical: true });
    return Buffer.concat([signed.r.toArrayLike(Buffer, 'be', 32), signed.s.toArrayLike(Buffer, 'be', 32)]);
  }

  /**
   * Computes EdDSA signature of message hash. Curve name is derrived from private key.
   *
   * @param hash Message hash
   */
  private computeEdDSASignature(hash: Buffer): Buffer {
    const eddsa = new elliptic.eddsa(this.parameters.curve.preset);
    const signed = eddsa.sign(hash, this.key, null);
    return Buffer.concat([signed.R.toArrayLike(Buffer, 'be', 32), signed.S.toArrayLike(Buffer, 'be', 32)]);
  }

  /**
   * Derives Public key out of Private key using EcDSA algorithm.
   */
  private getEcDSAPublicKey(): PublicKey {
    const ec = new elliptic.ec(this.parameters.curve.preset);
    const keyPair = ec.keyFromPrivate(this.key, 'hex');
    const pk = keyPair.getPublic(true, 'hex');

    return new PublicKey(pk, this.algorithm, this.parameters);
  }

  /**
   * Derives Public key out of Private key using EdDSA algorithm.
   */
  private getEdDSAPublicKey(): PublicKey {
    const eddsa = new elliptic.eddsa(this.parameters.curve.preset);
    const keyPair = eddsa.keyFromSecret(this.key, 'hex');
    const pk = keyPair.getPublic(true, 'hex');

    return new PublicKey(pk, this.algorithm, this.parameters);
  }
}
