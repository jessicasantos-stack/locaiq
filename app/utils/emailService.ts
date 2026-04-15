/**
 * Email Service
 * Envia relatórios semanais por email
 * Suporta: Resend, SendGrid, ou SMTP genérico
 */

interface EmailOptions {
  to: string[];
  subject: string;
  htmlContent: string;
  textContent: string;
  from?: string;
}

// ============================================================================
// RESEND (Padrão)
// ============================================================================

export async function sendEmailViaResend(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      return { success: false, error: 'RESEND_API_KEY not configured' };
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: options.from || 'zenith@zenith.local',
        to: options.to,
        subject: options.subject,
        html: options.htmlContent,
        text: options.textContent,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { success: false, error: error.message };
    }

    const data = await response.json();
    return { success: true, messageId: data.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SENDGRID
// ============================================================================

export async function sendEmailViaSendGrid(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      return { success: false, error: 'SENDGRID_API_KEY not configured' };
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        personalizations: [
          {
            to: options.to.map((email) => ({ email })),
          },
        ],
        from: {
          email: options.from || 'zenith@zenith.local',
        },
        subject: options.subject,
        content: [
          {
            type: 'text/html',
            value: options.htmlContent,
          },
          {
            type: 'text/plain',
            value: options.textContent,
          },
        ],
      }),
    });

    if (!response.ok) {
      return { success: false, error: `SendGrid error: ${response.status}` };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// SMTP (Genérico)
// ============================================================================

export async function sendEmailViaSMTP(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  try {
    // Nota: Isso requer um serviço backend diferente
    // Por enquanto, retornar erro
    return {
      success: false,
      error: 'SMTP not implemented. Use Resend or SendGrid.',
    };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ROUTER AUTOMÁTICO
// ============================================================================

export async function sendEmail(
  options: EmailOptions
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  // Tentar Resend primeiro (mais fácil de usar)
  if (process.env.RESEND_API_KEY) {
    return sendEmailViaResend(options);
  }

  // Tentar SendGrid
  if (process.env.SENDGRID_API_KEY) {
    return sendEmailViaSendGrid(options);
  }

  // Nenhum configurado
  return {
    success: false,
    error: 'No email service configured. Set RESEND_API_KEY or SENDGRID_API_KEY.',
  };
}

// ============================================================================
// EMAIL BUILDER
// ============================================================================

export function buildReportEmail(
  clientName: string,
  htmlContent: string
): { subject: string; text: string } {
  const subject = `📊 Relatório Semanal — ${clientName}`;

  const text = `
Olá,

Seu relatório semanal está pronto! Veja os dados completos no dashboard do Zenith.

Período: Esta semana
Cliente: ${clientName}

Acesse: ${process.env.NEXT_PUBLIC_APP_URL}/dashboard

Atenciosamente,
Zenith
  `.trim();

  return { subject, text };
}
