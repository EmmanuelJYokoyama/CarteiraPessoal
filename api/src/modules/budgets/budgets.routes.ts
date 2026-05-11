import {FastifyInstance} from 'fastify';
import {createNewBudget, listBudgets, getBudgetHandler, updateBudgetHandler, deleteBudgetHandler, getBudgetProgressHandler} from './budgets.controller';

export async function budgetsRoutes(app: FastifyInstance) {
  app.post('/budgets', createNewBudget);
  app.get('/budgets', listBudgets);
  app.get('/budgets/:budgetId', getBudgetHandler);
  app.put('/budgets/:budgetId', updateBudgetHandler);
  app.delete('/budgets/:budgetId', deleteBudgetHandler);
  app.get('/budgets/:budgetId/progress', getBudgetProgressHandler);
}
