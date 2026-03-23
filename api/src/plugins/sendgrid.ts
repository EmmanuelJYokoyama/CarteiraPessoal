type SendConfirmationEmailInput = {
  to: string;
  name: string;
  confirmLink: string;
};

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`MISSING_ENV_${name}`);
  }
  return value;
}

function buildConfirmationHtml(name: string, confirmLink: string): string {
  return `
<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Confirme sua conta</title>
  </head>
  <body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif;color:#111827;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:24px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e7eb;border-radius:12px;padding:28px;">
            <tr>
              <td>
                <h1 style="margin:0 0 12px;font-size:22px;line-height:1.35;">Confirme seu e-mail</h1>
                <p style="margin:0 0 14px;font-size:15px;line-height:1.6;">Oi ${name}, recebemos seu cadastro na Carteira Pessoal.</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.6;">Clique no botão abaixo para ativar sua conta com um token JWT temporário.</p>
                <a href="${confirmLink}" style="display:inline-block;background:#0f766e;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 18px;border-radius:10px;">Ativar minha conta</a>
                <p style="margin:22px 0 8px;font-size:13px;line-height:1.6;color:#4b5563;">Se o botão não funcionar, copie e cole o link no navegador:</p>
                <p style="margin:0;font-size:13px;word-break:break-all;color:#0f766e;">${confirmLink}</p>
                <p style="margin:20px 0 0;font-size:12px;color:#6b7280;">Este link expira em 24 horas.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>
`.trim();
}

export async function sendConfirmationEmail({
  to,
  name,
  confirmLink,
}: SendConfirmationEmailInput): Promise<void> {
  const apiKey = getRequiredEnv('SENDGRID_API_KEY');
  const fromEmail = getRequiredEnv('SENDGRID_FROM_EMAIL');

  const html = buildConfirmationHtml(name, confirmLink);

  const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personalizations: [{to: [{email: to}]}],
      from: {email: fromEmail, name: 'Carteira Pessoal'},
      subject: 'Confirme seu cadastro',
      content: [{type: 'text/html', value: html}],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`SENDGRID_ERROR_${response.status}_${details}`);
  }
}
