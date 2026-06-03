import {FastifyInstance} from 'fastify';
import {createNewBudget, listBudgets, getBudgetHandler, updateBudgetHandler, deleteBudgetHandler, getBudgetProgressHandler, checkBudgetAlertsHandler, getBudgetsStatusHandler} from './budgets.controller';

export async function budgetsRoutes(app: FastifyInstance) {
  app.post('/budgets', createNewBudget);
  app.get('/budgets', listBudgets);
  app.get('/budgets/status', getBudgetsStatusHandler);
  app.get('/budgets/:budgetId', getBudgetHandler);
  app.put('/budgets/:budgetId', updateBudgetHandler);
  app.delete('/budgets/:budgetId', deleteBudgetHandler);
  app.get('/budgets/:budgetId/progress', getBudgetProgressHandler);
  app.post('/budgets/check-alerts', checkBudgetAlertsHandler);
}
