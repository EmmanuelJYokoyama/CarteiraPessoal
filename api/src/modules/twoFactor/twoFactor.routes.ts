import {FastifyInstance} from 'fastify';
import {initiateTwoFactorHandler, validateOtpHandler} from '../otp/otp.controller';

export async function registerTwoFactorRoutes(app: FastifyInstance) {
  app.post<{Body: {phoneNumber: string}}>('/auth/2fa/initiate', initiateTwoFactorHandler);
  app.post<{Body: {code: string}}>('/auth/2fa/validate', validateOtpHandler);
}
