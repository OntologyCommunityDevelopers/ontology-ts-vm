import 'babel-polyfill';
import * as Long from 'long';
import { ByteArrayType } from '../../src/vm/types/byteArray';
import { IntegerType, isIntegerType } from '../../src/vm/types/integer';
import { isMapType } from '../../src/vm/types/map';
import { deployAndInvoke, loadContract } from '../utils';

describe('Dict test', () => {
  test('test Dict 1', async () => {
    const contract = loadContract('./test/python/compiled/dictTest1.avm');

    const response = await deployAndInvoke(contract, 1);
    expect(isMapType(response.result)).toBeTruthy();

    if (isMapType(response.result)) {
      expect(
        response.result
          .tryGetValue(new IntegerType(Long.fromNumber(13)))
          .getBigInteger()
          .toNumber()
      ).toBe(3);

      expect(
        response.result
          .tryGetValue(new ByteArrayType(new Buffer('a')))
          .getBigInteger()
          .toNumber()
      ).toBe(4);
    }
  });

  test('test Dict 2', async () => {
    const contract = loadContract('./test/python/compiled/dictTest2.avm');

    const response = await deployAndInvoke(contract, 1);
    expect(isIntegerType(response.result)).toBeTruthy();
    expect(response.result.getBigInteger().toNumber()).toBe(7);
  });

  test('test Dict 3', async () => {
    const contract = loadContract('./test/python/compiled/dictTest3.avm');

    const response = await deployAndInvoke(contract, 1);
    expect(isMapType(response.result)).toBeTruthy();
  });
});