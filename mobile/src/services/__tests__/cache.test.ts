import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  addPendingRequest,
  clearAllAppData,
  clearPendingRequests,
  getPendingRequests,
  removePendingRequest,
} from '../cache';
import {
  clearPendingRequestsTable,
  deletePendingRequest,
  insertPendingRequest,
  listPendingRequests,
} from '../offlineDatabase';

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
    getAllKeys: jest.fn(),
  },
}));

jest.mock('../offlineDatabase', () => {
  let rows: Array<{
    id: string;
    method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    path: string;
    body: string | null;
    timestamp: number;
  }> = [];

  return {
    __esModule: true,
    insertPendingRequest: jest.fn(async request => {
      rows = rows.filter(row => row.id !== request.id);
      rows.push({
        id: request.id,
        method: request.method,
        path: request.path,
        body: request.body === undefined ? null : JSON.stringify(request.body),
        timestamp: request.timestamp,
      });
      rows.sort((left, right) => left.timestamp - right.timestamp);
    }),
    listPendingRequests: jest.fn(async () => rows),
    deletePendingRequest: jest.fn(async id => {
      rows = rows.filter(row => row.id !== id);
    }),
    clearPendingRequestsTable: jest.fn(async () => {
      rows = [];
    }),
    parseOfflineRequestBody: jest.fn((body: string | null) => {
      if (!body) {
        return undefined;
      }

      return JSON.parse(body);
    }),
  };
});

const asyncStorageMock = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const insertPendingRequestMock = insertPendingRequest as jest.MockedFunction<typeof insertPendingRequest>;
const listPendingRequestsMock = listPendingRequests as jest.MockedFunction<typeof listPendingRequests>;
const deletePendingRequestMock = deletePendingRequest as jest.MockedFunction<typeof deletePendingRequest>;
const clearPendingRequestsTableMock = clearPendingRequestsTable as jest.MockedFunction<typeof clearPendingRequestsTable>;

describe('cache pending requests', () => {
  let storage: Record<string, string | null>;

  beforeEach(() => {
    jest.clearAllMocks();
    storage = {
      '@pending_requests': null,
      '@pending_requests_migrated': null,
    };

    asyncStorageMock.getItem.mockImplementation(async key => storage[key] ?? null);
    asyncStorageMock.setItem.mockImplementation(async (key, value) => {
      storage[key] = value;
    });
    asyncStorageMock.removeItem.mockImplementation(async key => {
      storage[key] = null;
    });
    asyncStorageMock.getAllKeys.mockResolvedValue([]);
  });

  beforeEach(async () => {
    await clearPendingRequestsTableMock();
  });

  it('migrates legacy async storage requests into SQLite and reads them back', async () => {
    storage['@pending_requests'] = JSON.stringify([
      {
        id: 'legacy-1',
        method: 'POST',
        path: '/transactions',
        body: {description: 'Café'},
        timestamp: 100,
      },
    ]);

    const requests = await getPendingRequests();

    expect(requests).toEqual([
      {
        id: 'legacy-1',
        method: 'POST',
        path: '/transactions',
        body: {description: 'Café'},
        timestamp: 100,
      },
    ]);
    expect(insertPendingRequestMock).toHaveBeenCalledWith(
      expect.objectContaining({id: 'legacy-1', path: '/transactions'})
    );
    expect(storage['@pending_requests']).toBeNull();
    expect(storage['@pending_requests_migrated']).toBe('true');
  });

  it('adds and removes requests through the SQLite queue', async () => {
    await addPendingRequest({method: 'POST', path: '/transactions', body: {amount: '10'}});

    let requests = await getPendingRequests();
    expect(requests).toHaveLength(1);
    expect(requests[0].body).toEqual({amount: '10'});

    await removePendingRequest(requests[0].id);
    requests = await getPendingRequests();

    expect(requests).toHaveLength(0);
    expect(deletePendingRequestMock).toHaveBeenCalledTimes(1);
  });

  it('clears the SQLite queue and migration flag on logout', async () => {
    storage['@pending_requests_migrated'] = 'true';
    await clearPendingRequests();
    await clearAllAppData();

    expect(clearPendingRequestsTableMock).toHaveBeenCalled();
    expect(storage['@pending_requests']).toBeNull();
    expect(storage['@pending_requests_migrated']).toBeNull();
  });
});
