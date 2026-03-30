import {FastifyInstance} from 'fastify';
import {setPin, validatePin, loginWithPin} from './pin.controller';

export async function pinRoutes(app: FastifyInstance) {
  app.post('/pin/set', setPin);
  app.post('/pin/validate', validatePin);
  app.post('/pin/login', loginWithPin);
}
