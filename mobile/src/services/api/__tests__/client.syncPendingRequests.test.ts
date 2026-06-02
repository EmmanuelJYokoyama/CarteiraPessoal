// @ts-nocheck
import AsyncStorage from '@react-native-async-storage/async-storage';
import {syncPendingRequests} from '../client';
import {getPendingRequests, removePendingRequest} from '@services/cache';
import {isNetworkOnline} from '@services/connectivity';

declare const global: typeof globalThis;

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  },
}));

jest.mock('@services/cache', () => ({
  __esModule: true,
  getCachedResponse: jest.fn(),
  setCachedResponse: jest.fn(),
  addPendingRequest: jest.fn(),
  getPendingRequests: jest.fn(),
  removePendingRequest: jest.fn(),
}));

jest.mock('@services/connectivity', () => ({
  __esModule: true,
  isNetworkOnline: jest.fn(),
}));

jest.mock('@services/telemetry/firebaseTelemetry', () => ({
  __esModule: true,
  logSyncEvent: jest.fn(),
}));

const asyncStorageMock = AsyncStorage as jest.Mocked<typeof AsyncStorage>;
const getPendingRequestsMock = getPendingRequests as jest.MockedFunction<typeof getPendingRequests>;
const removePendingRequestMock = removePendingRequest as jest.MockedFunction<typeof removePendingRequest>;
const isNetworkOnlineMock = isNetworkOnline as jest.MockedFunction<typeof isNetworkOnline>;
let fetchMock: jest.Mock;

describe('syncPendingRequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    asyncStorageMock.getItem.mockResolvedValue(null);
    isNetworkOnlineMock.mockReturnValue(true);
    getPendingRequestsMock.mockResolvedValue([]);
    removePendingRequestMock.mockResolvedValue();
    fetchMock = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      statusText: 'OK',
      json: async () => ({success: true}),
    } as Response);
    Object.defineProperty(global, 'fetch', {
      value: fetchMock,
      writable: true,
      configurable: true,
    });
  });

  it('replays pending requests and removes them after success', async () => {
    getPendingRequestsMock.mockResolvedValue([
      {
        id: 'request-1',
        method: 'POST',
        path: '/transactions',
        body: {description: 'Café', amount: '10'},
        timestamp: 123,
      },
    ]);

    const result = await syncPendingRequests();

    expect(result).toEqual({success: 1, failed: 0});
    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:3000/transactions',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify({description: 'Café', amount: '10'}),
      })
    );
    expect(removePendingRequestMock).toHaveBeenCalledWith('request-1');
  });

  it('skips sync when offline', async () => {
    isNetworkOnlineMock.mockReturnValue(false);

    const result = await syncPendingRequests();

    expect(result).toEqual({success: 0, failed: 0});
    expect(getPendingRequestsMock).not.toHaveBeenCalled();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('keeps the request queued when replay fails', async () => {
    getPendingRequestsMock.mockResolvedValue([
      {
        id: 'request-2',
        method: 'POST',
        path: '/transactions',
        body: {description: 'Erro', amount: '20'},
        timestamp: 456,
      },
    ]);

    fetchMock = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      json: async () => ({error: 'boom'}),
    } as Response);
    Object.defineProperty(global, 'fetch', {
      value: fetchMock,
      writable: true,
      configurable: true,
    });

    const result = await syncPendingRequests();

    expect(result).toEqual({success: 0, failed: 1});
    expect(removePendingRequestMock).not.toHaveBeenCalled();
  });
});
