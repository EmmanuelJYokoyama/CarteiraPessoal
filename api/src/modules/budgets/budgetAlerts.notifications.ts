import {sendGenericSms} from '@plugins/twilio';
import {BudgetAlertNotification, getUserPhoneNumber, registerBudgetAlert} from './budgetAlerts.service';

function buildAlertMessage(notification: BudgetAlertNotification): string {
  const percent = notification.percent.toFixed(1);
  const amount = notification.totalSpent.toFixed(2);
  const limit = notification.limit.toFixed(2);

  if (notification.level === 100) {
    return `Orçamento ${notification.budgetName}: limite atingido${notification.isOverBudget ? ' e ultrapassado' : ''}. ${percent}% usado (R$ ${amount} de R$ ${limit}).`;
  }

  return `Alerta preventivo: orçamento ${notification.budgetName} chegou a ${percent}% do limite. R$ ${amount} de R$ ${limit}.`;
}

export async function sendBudgetAlert(notification: BudgetAlertNotification) {
  const phoneNumber = await getUserPhoneNumber(notification.userId);
  const message = buildAlertMessage(notification);

  if (phoneNumber) {
    await sendGenericSms({phone: phoneNumber, message});
  } else {
    console.warn('[BudgetAlerts] Usuário sem phoneNumber, registrando alerta sem envio');
  }

  await registerBudgetAlert(notification);
}

export async function sendBudgetAlerts(notifications: BudgetAlertNotification[]) {
  for (const notification of notifications) {
    await sendBudgetAlert(notification);
  }
}