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
import { Address } from '../../common/address';
import { TracedError } from '../../common/error';
import { ST_CONTRACT, ST_STORAGE } from '../../core/state/dataEntryPrefix';
import { isStorageItem, StorageItem } from '../../core/state/storageItem';
import { evaluationStackCount, popByteArray, popInteropInterface, pushData } from '../../vm/func/common';
import { ExecutionEngine } from '../../vm/interfaces/engine';
import { Writer } from '../../vm/utils/writer';
import { VmService } from '../context';
import { isStorageContext, StorageContext } from '../storageContext';

/**
 * StoragePut put smart contract storage item to cache
 */
export function storagePut(service: VmService, engine: ExecutionEngine) {
  if (evaluationStackCount(engine) < 3) {
    throw new TracedError('[Context] Too few input parameters ');
  }

  try {
    const context = getContext(engine);

    if (context.isReadOnly()) {
      throw new TracedError('[StoragePut] storage read only!');
    }

    try {
      checkStorageContext(service, context);
    } catch (e) {
      throw new TracedError(`[StoragePut] check context error.`, e);
    }

    const key = popByteArray(engine);

    if (key.length > 1024) {
      throw new TracedError('[StoragePut] Storage key to long');
    }

    const value = popByteArray(engine);

    service.getStateStore().add(ST_STORAGE, getStorageKey(context.getAddress(), key), new StorageItem(value));
  } catch (e) {
    throw new TracedError('[StoragePut] get pop context error!', e);
  }
}

/**
 * StorageDelete delete smart contract storage item from cache
 */
export function storageDelete(service: VmService, engine: ExecutionEngine) {
  if (evaluationStackCount(engine) < 2) {
    throw new TracedError('[Context] Too few input parameters ');
  }

  try {
    const context = getContext(engine);

    if (context.isReadOnly()) {
      throw new TracedError('[StorageDelete] storage read only!');
    }
    try {
      checkStorageContext(service, context);
    } catch (e) {
      throw new TracedError(`[StorageDelete] check context error.`, e);
    }
    const ba = popByteArray(engine);

    service.getStateStore().delete(ST_STORAGE, getStorageKey(context.getAddress(), ba));
  } catch (e) {
    throw new TracedError('[StorageDelete] get pop context error!', e);
  }
}

/**
 * StorageGet push smart contract storage item from cache to vm stack
 */
export function storageGet(service: VmService, engine: ExecutionEngine) {
  if (evaluationStackCount(engine) < 2) {
    throw new TracedError('[Context] Too few input parameters ');
  }

  try {
    const context = getContext(engine);

    const ba = popByteArray(engine);
    const item = service.getStateStore().get(ST_STORAGE, getStorageKey(context.getAddress(), ba));

    if (item === undefined) {
      pushData(engine, new Buffer(''));
    } else {
      if (isStorageItem(item.value)) {
        pushData(engine, item.value.getValue());
      }
    }
  } catch (e) {
    throw new TracedError(`[StorageGet] get pop context error.`, e);
  }
}

/**
 * StorageGetContext push smart contract storage context to vm stack
 */
export function storageGetContext(service: VmService, engine: ExecutionEngine) {
  const ctx = service.getContextRef().currentContext();

  if (ctx === undefined) {
    throw new TracedError('[storageGetContext] Context is empty');
  }
  pushData(engine, new StorageContext(ctx.contractAddress));
}

export function storageGetReadOnlyContext(service: VmService, engine: ExecutionEngine) {
  const ctx = service.getContextRef().currentContext();

  if (ctx === undefined) {
    throw new TracedError('[storageGetContext] Context is empty');
  }

  const context = new StorageContext(ctx.contractAddress);
  context.setReadOnly(true);
  pushData(engine, context);
}

export function checkStorageContext(service: VmService, context: StorageContext) {
  try {
    const item = service.getStateStore().get(ST_CONTRACT, context.getAddress().toArray());
    if (item === undefined) {
      throw new TracedError('[CheckStorageContext] get context null!');
    }
  } catch (e) {
    throw new TracedError('[CheckStorageContext] get context fail!', e);
  }
}

export function getContext(engine: ExecutionEngine): StorageContext {
  const opInterface = popInteropInterface(engine);

  if (isStorageContext(opInterface)) {
    return opInterface;
  } else {
    throw new TracedError('[Context] Get storageContext invalid');
  }
}

export function getStorageKey(address: Address, key: Buffer): Buffer {
  const w = new Writer();
  w.writeBytes(address.toArray());
  w.writeBytes(key);
  return w.getBytes();
}
