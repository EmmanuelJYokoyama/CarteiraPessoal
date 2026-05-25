import SQLite from 'react-native-sqlite-storage';

SQLite.enablePromise(true);

const DATABASE_NAME = 'carteira_pessoal.db';
const PENDING_REQUESTS_TABLE = 'pending_requests';

export type OfflineRequestRow = {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body: string | null;
  timestamp: number;
};

export type OfflineRequestInput = Omit<OfflineRequestRow, 'body'> & {
  body?: unknown;
};

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (!databasePromise) {
    databasePromise = SQLite.openDatabase({name: DATABASE_NAME, location: 'default'}).then(
      async database => {
        await database.executeSql(`
          CREATE TABLE IF NOT EXISTS ${PENDING_REQUESTS_TABLE} (
            id TEXT PRIMARY KEY NOT NULL,
            method TEXT NOT NULL,
            path TEXT NOT NULL,
            body TEXT,
            timestamp INTEGER NOT NULL
          );
        `);

        return database;
      }
    );
  }

  return databasePromise;
}

export async function insertPendingRequest(request: OfflineRequestInput): Promise<void> {
  const database = await getDatabase();
  const serializedBody = request.body === undefined ? null : JSON.stringify(request.body);

  await database.executeSql(
    `
      INSERT OR REPLACE INTO ${PENDING_REQUESTS_TABLE} (id, method, path, body, timestamp)
      VALUES (?, ?, ?, ?, ?);
    `,
    [request.id, request.method, request.path, serializedBody, request.timestamp]
  );
}

export async function listPendingRequests(): Promise<OfflineRequestRow[]> {
  const database = await getDatabase();
  const [result] = await database.executeSql(
    `
      SELECT id, method, path, body, timestamp
      FROM ${PENDING_REQUESTS_TABLE}
      ORDER BY timestamp ASC;
    `
  );

  const requests: OfflineRequestRow[] = [];

  for (let index = 0; index < result.rows.length; index += 1) {
    const row = result.rows.item(index) as OfflineRequestRow;
    requests.push(row);
  }

  return requests;
}

export async function deletePendingRequest(id: string): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(`DELETE FROM ${PENDING_REQUESTS_TABLE} WHERE id = ?;`, [id]);
}

export async function clearPendingRequestsTable(): Promise<void> {
  const database = await getDatabase();
  await database.executeSql(`DELETE FROM ${PENDING_REQUESTS_TABLE};`);
}

export async function countPendingRequests(): Promise<number> {
  const database = await getDatabase();
  const [result] = await database.executeSql(
    `SELECT COUNT(*) AS total FROM ${PENDING_REQUESTS_TABLE};`
  );

  const row = result.rows.item(0) as {total?: number};
  return typeof row.total === 'number' ? row.total : 0;
}

export function parseOfflineRequestBody(body: string | null): unknown {
  if (!body) {
    return undefined;
  }

  try {
    return JSON.parse(body);
  } catch {
    return body;
  }
}
