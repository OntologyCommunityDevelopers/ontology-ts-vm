import * as bigInt from 'big-integer';
import * as Long from 'long';
import { PublicKey } from '../crypto/publicKey';
import * as O from '../vm/opCode';
import { Writer } from '../vm/utils/writer';
import { bigIntToBytes } from './utils';

export class ProgramBuilder {
  w: Writer;

  constructor() {
    this.w = new Writer();
  }

  pushPubKey(key: PublicKey) {
    this.pushBytes(key.serialize());
  }

  writeOpCode(opCode: O.OpCode) {
    this.w.writeUint8(opCode);
  }

  writeByte(val: number) {
    this.w.writeUint8(val);
  }

  writeBytes(b: Buffer) {
    this.w.writeBytes(b);
  }

  writeVarUInt(val: Long) {
    this.w.writeVarUint(val);
  }

  pushBytes(data: Buffer) {
    // pushing empty buffer should not do any damage
    // if (data.length === 0) {
    //   throw new Error('push data error: data is nil');
    // }

    if (data.length <= O.PUSHBYTES75 + 1 - O.PUSHBYTES1) {
      this.w.writeUint8(data.length + O.PUSHBYTES1 - 1);
    } else if (data.length < 0x100) {
      this.w.writeUint8(O.PUSHDATA1);
      this.w.writeUint8(data.length);
    } else if (data.length < 0x10000) {
      this.w.writeUint8(O.PUSHDATA2);
      this.w.writeUint16(data.length);
    } else {
      this.w.writeUint8(O.PUSHDATA4);
      this.w.writeUint32(data.length);
    }
    this.w.writeBytes(data);
  }

  pushNum(num: number) {
    if (num === -1) {
      this.writeOpCode(O.PUSHM1);
    } else if (num === 0) {
      this.writeOpCode(O.PUSH0);
    } else if (num > 0 && num < 16) {
      this.writeOpCode(num - 1 + O.PUSH1);
    } else {
      this.pushBytes(bigIntToBytes(bigInt(num)));
    }
  }

  pushBool(param: boolean) {
    if (param) {
      this.writeOpCode(O.PUSHT);
    } else {
      this.writeOpCode(O.PUSHF);
    }
  }
  getProgram(): Buffer {
    return this.w.getBytes();
  }
}

export function programFromPubKey(key: PublicKey): Buffer {
  const b = new ProgramBuilder();
  b.pushPubKey(key);
  b.writeOpCode(O.CHECKSIG);
  return b.getProgram();
}
