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
import 'babel-polyfill';
import * as ByteBuffer from 'bytebuffer';
import * as Long from 'long';

// tslint:disable : no-console
describe('Bytebuffer test', () => {
  test('Long interaction', async () => {
    const buffer = new ByteBuffer();

    buffer.writeUint64(Long.ZERO);
  });

  test('Capacity handling', async () => {
    const buffer = new ByteBuffer(4);

    buffer.writeInt32(0);
    buffer.flip();

    const result = new Buffer(buffer.toBuffer());

    expect(result.length).toBe(4);
  });
});
