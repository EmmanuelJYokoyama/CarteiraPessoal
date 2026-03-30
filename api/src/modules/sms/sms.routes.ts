import {FastifyInstance} from 'fastify';
import {confirmSms, resendConfirmationSms} from './sms.controller';

export async function smsRoutes(app: FastifyInstance) {
  app.post('/sms/confirm', confirmSms);
  app.post('/sms/resend', resendConfirmationSms);
}
