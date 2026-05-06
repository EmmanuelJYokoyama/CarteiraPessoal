import {FastifyRequest, FastifyReply} from 'fastify';
import {JwtPayload} from '../../types/jwt';
import {parseAndLogBankMessage, processBankSms} from './sms.service';

export async function parseBankSmsHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const user = request.user as JwtPayload;
    const {message, cardId} = request.body as {message: string; cardId: string};

    if (!message || !cardId) {
      return reply.status(400).send({error: 'MESSAGE_AND_CARD_ID_REQUIRED'});
    }

    const result = await parseAndLogBankMessage(user.userId, cardId, message);

    if (!result.success) {
      return reply.status(400).send({
        error: 'FAILED_TO_PARSE_SMS',
        details: result.error,
      });
    }

    reply.status(200).send({
      success: true,
      data: result.data,
      message: `Transação de R$ ${result.data?.amount.toFixed(2)} processada com sucesso`,
    });
  } catch (error) {
    console.error('Erro ao processar SMS:', error);
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}

export async function testBankSmsParsingHandler(
  request: FastifyRequest,
  reply: FastifyReply
): Promise<void> {
  try {
    const {message} = request.body as {message: string};

    if (!message) {
      return reply.status(400).send({error: 'MESSAGE_REQUIRED'});
    }

    const {parseBankSms} = await import('./sms.parser');
    const result = parseBankSms(message);

    reply.status(200).send({
      parsed: result.parsed,
      bank: result.bank,
      amount: result.amount,
      establishment: result.establishment,
      date: result.date,
      rawMessage: result.rawMessage,
    });
  } catch (error) {
    console.error('Erro ao testar parsing:', error);
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}
