export interface SendTokenEmailParams {
  emailUsuario: string;
  nomeUsuario: string;
  tokenGerado: string;
}

export const sendValidationEmailResend = async ({
  emailUsuario,
  nomeUsuario,
  tokenGerado,
}: SendTokenEmailParams): Promise<{ success: boolean; messageId?: string; error?: string }> => {
  const apiKey = (import.meta.env.VITE_RESEND_API_KEY as string) || '';

  if (!apiKey) {
    console.warn('[Resend Email] API Key não configurada. Simulando envio de e-mail.');
    console.log(`[Resend SIMULAÇÃO] Para: ${emailUsuario} (${nomeUsuario}) | Token: ${tokenGerado}`);
    return { success: true, messageId: 'simulated-local-id' };
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Validacao <onboarding@resend.dev>',
        to: [emailUsuario],
        subject: 'Seu código de validação de comentário — Apoio na rede',
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 10px;">
            <h2 style="color: #064b5f; margin-top: 0;">Olá, ${nomeUsuario}!</h2>
            <p>Para confirmar e autorizar a publicação do seu comentário no <strong>Apoio na rede</strong>, digite o código abaixo no site:</p>
            <div style="background: #f4f4f4; padding: 15px; font-size: 28px; font-weight: bold; letter-spacing: 6px; text-align: center; border-radius: 8px; margin: 20px 0; color: #064b5f; border: 2px dashed #064b5f;">
              ${tokenGerado}
            </div>
            <p style="font-size: 13px; color: #666;">Se você não tentou comentar, por favor ignore este e-mail.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin-top: 20px;" />
            <p style="font-size: 11px; color: #999; text-align: center; margin-bottom: 0;">
              Apoio na rede — Acessibilidade Urbana e Inclusão
            </p>
          </div>
        `,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || errorData.error || `Erro HTTP ${response.status}`);
    }

    const data = await response.json();
    console.log('E-mail via Resend enviado com sucesso!', data.id || data);
    return { success: true, messageId: data.id || 'sent' };
  } catch (error: any) {
    console.error('Erro ao enviar e-mail via Resend:', error);
    return { success: false, error: error.message || 'Falha na conexão com a API do Resend' };
  }
};
