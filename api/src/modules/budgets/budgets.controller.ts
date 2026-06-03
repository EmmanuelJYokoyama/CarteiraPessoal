import {FastifyRequest, FastifyReply} from 'fastify';
import {createBudgetSchema, updateBudgetSchema} from './budgets.schema';
import {createBudget, getBudgetsByUserId, getBudgetById, updateBudget, deleteBudget, calculateBudgetProgress} from './budgets.service';
import type {AuthTokenPayload} from '../auth/auth.types';
import {checkBudgetAlertCandidatesForUser} from './budgetAlerts.service';
import {sendBudgetAlerts} from './budgetAlerts.notifications';

export async function createNewBudget(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  try {
    const input = createBudgetSchema.parse(req.body);
    const result = await createBudget(user.userId, input);
    return reply.status(201).send(result);
  } catch (error: any) {
    return reply.status(400).send({error: error.message});
  }
}

export async function listBudgets(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  try {
    const result = await getBudgetsByUserId(user.userId);
    return reply.send(result);
  } catch (error: any) {
    return reply.status(500).send({error: error.message});
  }
}

export async function getBudgetHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  const {budgetId} = req.params as {budgetId: string};
  try {
    const result = await getBudgetById(budgetId, user.userId);
    return reply.send(result);
  } catch (error: any) {
    if (error.message === 'BUDGET_NOT_FOUND') return reply.status(404).send({error: 'Budget not found'});
    return reply.status(500).send({error: error.message});
  }
}

export async function updateBudgetHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  const {budgetId} = req.params as {budgetId: string};
  try {
    const input = updateBudgetSchema.parse(req.body);
    const result = await updateBudget(budgetId, user.userId, input);
    return reply.send({budget: result});
  } catch (error: any) {
    return reply.status(400).send({error: error.message});
  }
}

export async function deleteBudgetHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  const {budgetId} = req.params as {budgetId: string};
  try {
    await deleteBudget(budgetId, user.userId);
    return reply.send({message: 'Budget deleted'});
  } catch (error: any) {
    return reply.status(500).send({error: error.message});
  }
}

export async function getBudgetProgressHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;
  const {budgetId} = req.params as {budgetId: string};
  try {
    const progress = await calculateBudgetProgress(budgetId, user.userId);
    return reply.send(progress);
  } catch (error: any) {
    if (error.message === 'BUDGET_NOT_FOUND') return reply.status(404).send({error: 'Budget not found'});
    return reply.status(500).send({error: error.message});
  }
}

export async function getBudgetsStatusHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;

  try {
    const userBudgets = await getBudgetsByUserId(user.userId);
    const status = await Promise.all(
      userBudgets.map(async (budget) => {
        const progress = await calculateBudgetProgress(budget.id, user.userId);
        return {
          id: budget.id,
          name: budget.name,
          current: Number(progress.totalSpent),
          target: Number(progress.limit),
          type: 'budget'
        };
      })
    );
    return reply.send(status);
  } catch (error: any) {
    return reply.status(500).send({error: error.message});
  }
}

export async function checkBudgetAlertsHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }
  const user = req.user as AuthTokenPayload;

  try {
    const notifications = await checkBudgetAlertCandidatesForUser(user.userId);
    if (notifications.length > 0) {
      await sendBudgetAlerts(notifications);
    }

    return reply.send({notificationsChecked: notifications.length, notifications});
  } catch (error: any) {
    return reply.status(500).send({error: error.message});
  }
}
