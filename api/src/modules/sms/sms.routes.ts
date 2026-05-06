import {FastifyInstance} from 'fastify';
import {confirmSms, resendConfirmationSms} from './sms.controller';
import {parseBankSmsHandler, testBankSmsParsingHandler} from './sms.parser.controller';

export async function smsRoutes(app: FastifyInstance) {
  app.post('/sms/confirm', confirmSms);
  app.post('/sms/resend', resendConfirmationSms);

  app.post(
    '/sms/parse-bank',
    {onRequest: [app.authenticate]},
    parseBankSmsHandler
  );

  app.post('/sms/test-parse', testBankSmsParsingHandler);
}
