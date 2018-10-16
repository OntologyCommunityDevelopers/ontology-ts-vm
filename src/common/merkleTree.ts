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
import { createHash, Hash } from 'crypto';
import { Uint256 } from './uint256';

export function computeMerkleRoot(hashes: Uint256[]): Uint256 {
  if (hashes.length === 0) {
    return new Uint256();
  }

  let temp: Uint256;

  while (hashes.length !== 1) {
    const n = hashes.length / 2;

    let sha: Hash;
    for (let i = 0; i < n; i++) {
      sha = createHash('sha256');

      sha.update(hashes[2 * i].toArray());
      sha.update(hashes[2 * i + 1].toArray());
      temp = Uint256.parseFromBytes(sha.digest());

      sha = createHash('sha256');
      sha.update(temp.toArray());
      hashes[i] = Uint256.parseFromBytes(sha.digest());
    }
    if (hashes.length === 2 * n + 1) {
      sha = createHash('sha256');
      sha.update(hashes[2 * n].toArray());
      sha.update(hashes[2 * n].toArray());
      temp = Uint256.parseFromBytes(sha.digest());

      sha = createHash('sha256');
      sha.update(temp.toArray());
      hashes[n] = Uint256.parseFromBytes(sha.digest());

      hashes = hashes.slice(0, n + 1);
    } else {
      hashes = hashes.slice(0, n);
    }
  }

  return hashes[0];
}
