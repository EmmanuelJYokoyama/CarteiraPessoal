import {FastifyRequest, FastifyReply} from 'fastify';
import type {AuthTokenPayload} from '../auth/auth.types';
import {checkBudgetAlertCandidatesForUser} from './budgetAlerts.service';
import {sendBudgetAlerts} from './budgetAlerts.notifications';

export async function checkBudgetAlertsHandler(req: FastifyRequest, reply: FastifyReply) {
  try { await req.jwtVerify(); } catch { return reply.status(401).send({error: 'Unauthorized'}); }

  const user = req.user as AuthTokenPayload;

  try {
    const candidates = await checkBudgetAlertCandidatesForUser(user.userId);

    if (candidates.length > 0) {
      await sendBudgetAlerts(candidates);
    }

    return reply.send({notificationsChecked: candidates.length, notifications: candidates});
  } catch (error: any) {
    return reply.status(500).send({error: error.message});
  }
}