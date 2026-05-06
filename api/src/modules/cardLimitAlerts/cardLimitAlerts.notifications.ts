import {db} from '@db/index';
import {users} from '@db/schema/users';
import {eq} from 'drizzle-orm';
import {getCardLimitStatus, getUserCardsLimitStatus} from './cardLimitAlerts.service';

export interface NotificationMessage {
  userId: string;
  cardName: string;
  usedAmount: number;
  limit: number;
  usedPercentage: number;
  alertPercentage: number;
}

export async function checkAndNotifyLimitAlerts(
  userId: string
): Promise<NotificationMessage[]> {
  const cardsWithAlerts = await getUserCardsLimitStatus(userId);
  const notificationsToSend: NotificationMessage[] = [];

  for (const alert of cardsWithAlerts) {
    if (alert.shouldAlert) {
      notificationsToSend.push({
        userId,
        cardName: alert.cardName,
        usedAmount: alert.usedAmount,
        limit: alert.limit,
        usedPercentage: alert.usedPercentage,
        alertPercentage: alert.alertPercentage,
      });
    }
  }

  if (notificationsToSend.length > 0) {
    await sendNotifications(notificationsToSend);
  }

  return notificationsToSend;
}

export async function checkAndNotifyAllUsers(): Promise<void> {
  const allUsers = await db.select({id: users.id}).from(users);

  for (const user of allUsers) {
    try {
      await checkAndNotifyLimitAlerts(user.id);
    } catch (error) {
      console.error(`Erro ao verificar alertas para usuário ${user.id}:`, error);
    }
  }
}

export async function sendNotifications(
  notifications: NotificationMessage[]
): Promise<void> {
  for (const notification of notifications) {
    await sendNotification(notification);
  }
}

async function sendNotification(notification: NotificationMessage): Promise<void> {
  try {
    const userData = await db
      .select({phoneNumber: users.phoneNumber})
      .from(users)
      .where(eq(users.id, notification.userId));

    if (!userData || userData.length === 0) {
      console.error(
        `Usuário ${notification.userId} não encontrado para enviar notificação`
      );
      return;
    }

    const user = userData[0];
    const code = generateAlertCode(notification);

    if (user.phoneNumber) {
      await sendSmsNotification(user.phoneNumber, code, notification);
    }
  } catch (error) {
    console.error(
      `Erro ao enviar notificação para usuário ${notification.userId}:`,
      error
    );
  }
}

function generateAlertCode(notification: NotificationMessage): string {
  return `${notification.cardName}: ${notification.usedPercentage.toFixed(1)}% do limite (R$ ${notification.usedAmount.toFixed(2)} de R$ ${notification.limit.toFixed(2)})`;
}

async function sendSmsNotification(
  phoneNumber: string,
  code: string,
  notification: NotificationMessage
): Promise<void> {
  try {
    const {sendOtpSms} = await import('@plugins/twilio');

    await sendOtpSms({
      phone: phoneNumber,
      code,
    });

    console.log(
      `✅ SMS de alerta enviado para ${phoneNumber}`
    );
  } catch (error) {
    console.error(`❌ Erro ao enviar SMS de alerta para ${phoneNumber}:`, error);
  }
}

