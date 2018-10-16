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

import { Reader } from '../vm/utils/reader';
import { Writer } from '../vm/utils/writer';
import { SignatureScheme } from './signatureScheme';

/**
 * Signature generated by signing data with Private Key.
 */
export class Signature {
  /**
   * Deserializes Signature
   * @param data
   */
  static deserialize(data: Buffer): Signature {
    if (data.length < 2) {
      throw new Error('Invalid params.');
    }

    if (data.length === 64) {
      const sigScheme = SignatureScheme.ECDSAwithSHA256;
      return new Signature(sigScheme, data);
    } else {
      const r = new Reader(data);
      const scheme = r.readByte();
      const sigScheme = SignatureScheme.fromHex(scheme);
      const value = r.readBytes(r.length() - r.position());
      return new Signature(sigScheme, value);
    }
  }

  algorithm: SignatureScheme;
  value: Buffer;

  constructor(algorithm: SignatureScheme, value: Buffer) {
    this.algorithm = algorithm;
    this.value = value;
  }

  /**
   * Serializes signature to Hex representation.
   * For transfer to java backend and verify it.
   */
  serialize(): Buffer {
    const w = new Writer();
    w.writeUint8(this.algorithm.hex);
    w.writeBytes(this.value);
    return w.getBytes();
  }
}
