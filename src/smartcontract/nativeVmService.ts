import { Address } from '../common/address';
import { StateStore } from '../core/state/stateStore';
import { Transaction } from '../core/transaction';
import { LogEventInfo, NotifyEventInfo } from '../event/notifyEvents';
import { newStackItem } from '../vm/func/common';
import { StackItem } from '../vm/types/stackItem';
import { Reader } from '../vm/utils/reader';
import { Writer } from '../vm/utils/writer';
import { ContextRef } from './context';
import { Contract } from './states/contract';

type RegisterService = (native: NativeVmService) => void;
type Handler = (native: NativeVmService) => Buffer;

export const contracts: Map<string, RegisterService> = new Map();

interface NativeVmServiceOptions {
  stateStore: StateStore;
  contextRef: ContextRef;
  code: Buffer;
  tx: Transaction;
  time: number;
  // height: number; - unused
  serviceMap: Map<string, Handler>;
}

export class NativeVmService {
  stateStore: StateStore;
  contextRef: ContextRef;
  code: Buffer;
  input: Buffer;
  tx: Transaction;
  time: number;
  // height: number; - unused
  private notifications: NotifyEventInfo[];
  private logs: LogEventInfo[];

  private serviceMap: Map<string, Handler>;

  constructor(options: NativeVmServiceOptions) {
    this.stateStore = options.stateStore;
    this.contextRef = options.contextRef;
    this.code = options.code;
    this.tx = options.tx;
    this.time = options.time;
    this.serviceMap = options.serviceMap;
    // this.height = options.height;
    this.notifications = [];
    this.logs = [];
  }

  invoke(): Promise<StackItem | undefined> {
    const contract = Contract.deserialize(new Reader(this.code));
    const addr = contract.address.toHexString();

    const services = contracts.get(addr);

    if (services === undefined) {
      throw new Error(`Native contract address ${addr} haven't been registered.`);
    }
    services(this);

    const service = this.serviceMap.get(contract.method);

    if (service === undefined) {
      throw new Error(`Native contract ${addr} doesn't support this function ${contract.method}.`);
    }

    const args = this.input;
    this.input = contract.args;

    this.contextRef.pushContext({ contractAddress: contract.address, code: new Buffer('') });

    const notifications = this.notifications;
    this.notifications = [];

    try {
      const result = service(this);
      this.contextRef.popContext();
      this.contextRef.pushNotifications(this.notifications);
      this.contextRef.pushLogs(this.logs);
      this.notifications = notifications;
      this.input = args;

      return Promise.resolve(newStackItem(result));
    } catch (e) {
      throw new Error('[Invoke] Native serivce function execute error!');
    }
  }

  register(methodName: string, handler: Handler) {
    this.serviceMap.set(methodName, handler);
  }

  addNotification(event: NotifyEventInfo) {
    this.notifications.push(event);
  }

  nativeCall(address: Address, method: string, args: Buffer): Promise<StackItem | undefined> {
    const c = new Contract({
      version: 0,
      address,
      method,
      args
    });
    const w = new Writer();

    c.serialize(w);

    this.code = w.getBytes();
    return this.invoke();
  }
}
