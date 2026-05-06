import {FastifyInstance} from 'fastify';
import {createNewTransaction, listTransactions, getTransaction, updateTransactionHandler, deleteTransactionHandler, payInstallmentHandler, checkDuplicateTransactions} from './transactions.controller';

export async function transactionsRoutes(app: FastifyInstance) {
  app.post('/transactions', createNewTransaction);
  app.get('/transactions', listTransactions);
  app.post('/transactions/check-duplicates', checkDuplicateTransactions);
  app.get('/transactions/:transactionId', getTransaction);
  app.put('/transactions/:transactionId', updateTransactionHandler);
  app.delete('/transactions/:transactionId', deleteTransactionHandler);
  app.post('/installments/pay', payInstallmentHandler);
}
