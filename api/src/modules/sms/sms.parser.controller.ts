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
    const {message, phoneNumber} = request.body as {message: string; phoneNumber?: string};

    if (!message) {
      return reply.status(400).send({error: 'MESSAGE_REQUIRED'});
    }

    const {parseBankSms} = await import('./sms.parser');
    const result = parseBankSms(message);

    // If parsing was successful and a phone number was provided, send confirmation SMS
    if (result.parsed && phoneNumber) {
      try {
        const {sendGenericSms} = await import('@plugins/twilio');
        const confirmationMessage = `✅ SMS reconhecido com sucesso!\nBanco: ${result.bank.toUpperCase()}\nValor: R$ ${result.amount.toFixed(2)}\nLocal: ${result.establishment || 'Desconhecido'}`;
        
        await sendGenericSms({
          phone: phoneNumber,
          message: confirmationMessage,
        });
        console.log(`📤 SMS de confirmação de parsing enviado para ${phoneNumber}`);
      } catch (smsError) {
        console.error('⚠️ Falha ao enviar SMS de confirmação:', smsError);
        // Don't throw - just log the error. Parsing was already successful.
      }
    }

    reply.status(200).send({
      parsed: result.parsed,
      bank: result.bank,
      amount: result.amount,
      establishment: result.establishment,
      date: result.date,
      rawMessage: result.rawMessage,
      smsSent: result.parsed && phoneNumber ? true : false,
    });
  } catch (error) {
    console.error('Erro ao testar parsing:', error);
    reply.status(500).send({error: 'INTERNAL_SERVER_ERROR'});
  }
}
