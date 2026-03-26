import {FastifyInstance} from 'fastify';
import {setPin, validatePin} from './pin.controller';

export async function pinRoutes(app: FastifyInstance) {
  app.post('/pin/set', setPin);
  app.post('/pin/validate', validatePin);
}
