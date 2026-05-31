import {FastifyInstance} from 'fastify';
import {getExchangeRate, listExchangeRates, normalizeCurrencyCode} from './exchangeRates.service';

export async function exchangeRatesRoutes(app: FastifyInstance) {
  app.get('/exchange-rates/:currency', async (req, reply) => {
    try {
      const {currency} = req.params as {currency: string};
      const {amount} = req.query as {amount?: string};
      const rate = await getExchangeRate(normalizeCurrencyCode(currency));

      if (amount) {
        const numericAmount = Number(amount);
        if (Number.isNaN(numericAmount) || numericAmount <= 0) {
          return reply.status(400).send({error: 'amount inválido'});
        }

        return reply.send({
          ...rate,
          originalAmount: numericAmount,
          convertedAmount: Number((numericAmount * rate.cotacaoVenda).toFixed(2)),
          conversionRate: rate.cotacaoVenda,
        });
      }

      return reply.send(rate);
    } catch (error: any) {
      return reply.status(400).send({error: error.message});
    }
  });

  app.get('/exchange-rates', async (req, reply) => {
    try {
      const {currencies} = req.query as {currencies?: string};
      const parsedCurrencies = (currencies ?? 'USD,EUR').split(',').map(item => item.trim()).filter(Boolean);
      const rates = await listExchangeRates(parsedCurrencies);
      return reply.send({rates});
    } catch (error: any) {
      return reply.status(400).send({error: error.message});
    }
  });
}