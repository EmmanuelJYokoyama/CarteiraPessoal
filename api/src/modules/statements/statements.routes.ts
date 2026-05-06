import {FastifyInstance} from 'fastify';
import {importStatementHandler, testParseStatementHandler} from './statements.controller';

export async function statementsRoutes(app: FastifyInstance) {
  app.post(
    '/statements/import',
    {onRequest: [app.authenticate]},
    importStatementHandler
  );

  app.post(
    '/statements/test-parse',
    testParseStatementHandler
  );
}
