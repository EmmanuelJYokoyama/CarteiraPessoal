import {FastifyInstance} from 'fastify';
import {initiateTwoFactorHandler, validateOtpHandler} from './otp.controller';

export async function otpRoutes(app: FastifyInstance) {
  app.post('/otp/initiate', initiateTwoFactorHandler);
  app.post('/otp/validate', validateOtpHandler);
}
