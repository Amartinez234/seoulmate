import 'fake-indexeddb/auto';
import { IDBFactory } from 'fake-indexeddb';
import { beforeEach } from 'vitest';
import { _resetDbConnection } from '../../src/lib/db';
import { lockVault } from '../../src/lib/vault';
import { resetAllDocs } from '../../src/lib/store';

beforeEach(() => {
  lockVault();
  resetAllDocs();
  _resetDbConnection();
  globalThis.indexedDB = new IDBFactory();
});
