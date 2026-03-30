import {FastifyRequest, FastifyReply} from 'fastify';
import {smsConfirmationSchema, resendSmsSchema} from './sms.schema';
import {confirmUserViaSms, resendSmsByEmail} from './sms.service';
import {generateTokens} from '../auth/auth.service';

export async function confirmSms(req: FastifyRequest, reply: FastifyReply) {
  const parsed = smsConfirmationSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const user = await confirmUserViaSms(parsed.data.email, parsed.data.code);
    const tokens = await generateTokens(req.server, user.id, user.email);
    
    return reply.status(200).send({
      message: 'Conta confirmada com sucesso',
      ...tokens,
      name: user.name,
      email: user.email,
    });
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'INVALID_CODE') {
      return reply.status(400).send({error: 'Código inválido'});
    }
    if (err.message === 'CODE_EXPIRED') {
      return reply.status(400).send({error: 'Código expirado'});
    }
    console.error('Erro ao confirmar via SMS:', err);
    return reply.status(500).send({error: 'Erro ao confirmar conta'});
  }
}

export async function resendConfirmationSms(
  req: FastifyRequest<{Body: {email: string}}>,
  reply: FastifyReply,
) {
  const parsed = resendSmsSchema.safeParse(req.body);
  if (!parsed.success) {
    return reply.status(400).send({error: parsed.error.flatten()});
  }

  try {
    const result = await resendSmsByEmail(parsed.data.email);
    return reply.status(200).send(result);
  } catch (err: any) {
    if (err.message === 'USER_NOT_FOUND') {
      return reply.status(404).send({error: 'Usuário não encontrado'});
    }
    if (err.message === 'PHONE_NOT_FOUND') {
      return reply.status(400).send({error: 'Telefone não cadastrado'});
    }
    if (err.message === 'ACCOUNT_ALREADY_CONFIRMED') {
      return reply.status(400).send({error: 'Conta já está ativada'});
    }
    if (err.message === 'FAILED_TO_SEND_SMS') {
      return reply.status(502).send({error: 'Falha ao enviar SMS'});
    }
    if (typeof err.message === 'string' && err.message.startsWith('TWILIO_ERROR_')) {
      return reply.status(502).send({error: 'Erro ao enviar SMS'});
    }
    console.error('Erro ao reenviar código:', err);
    return reply.status(500).send({error: 'Erro ao reenviar código'});
  }
}
