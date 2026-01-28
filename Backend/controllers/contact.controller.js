const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const files = req.files || [];

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    const subjectMap = {
      'custom': 'Peça Personalizada',
      'quote': 'Pedido de Orçamento',
      'support': 'Suporte Técnico',
      'info': 'Informações Gerais',
      'partnership': 'Parcerias',
      'other': 'Outro'
    };
    const subjectText = subjectMap[subject] || subject;

    // ✅ Responder imediatamente ao frontend
    res.json({ success: true, message: 'Mensagem enviada com sucesso!' });

    // ===== Envio de email em background =====
    (async () => {
      try {
        const attachments = files.map(file => ({
          filename: file.originalname,
          path: file.path
        }));

        // Email para admin
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `📧 Novo Contacto: ${subjectText} - ${name}`,
          html: `
            <!DOCTYPE html>
            <html lang="pt">
            <head>
              <meta charset="UTF-8">
              <style>
                body, p, h1, h2, div, ul, li { margin:0; padding:0; font-family:'Courier New', monospace; color:#111; }
                body { background:#f0f0f0; padding:20px; }
                .container { max-width:700px; margin:auto; background:#fff; border:4px solid #111; overflow:hidden; }
                .header { background:#111; color:#fff; padding:20px; text-align:center; letter-spacing:1px; }
                .header h1 { font-size:22px; }
                .content { padding:24px; }
                h2 { font-size:18px; color:#111; border-bottom:2px solid #111; margin-bottom:12px; }
                .message { background:#eee; padding:16px; border:2px solid #111; white-space:pre-wrap; margin-bottom:16px; }
                .attachments ul { list-style:none; padding-left:0; }
                .attachments li { margin:4px 0; }
                .footer { background:#111; color:#fff; text-align:center; padding:16px; font-size:12px; letter-spacing:1px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header"><h1>📨 Nova Mensagem de Contacto - XYZ Labs</h1></div>
                <div class="content">
                  <div class="info">
                    <p><strong>Nome:</strong> ${name}</p>
                    <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
                    ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
                    <p><strong>Assunto:</strong> ${subjectText}</p>
                  </div>
                  <div class="message">
                    <h2>Mensagem:</h2>
                    <p>${message}</p>
                  </div>
                  ${files.length > 0 ? `
                    <div class="attachments">
                      <h2>Ficheiros Anexados:</h2>
                      <ul>
                        ${files.map(f => `<li>${f.originalname} (${(f.size/1024).toFixed(1)} KB)</li>`).join('')}
                      </ul>
                    </div>
                  ` : ''}
                </div>
                <div class="footer">XYZ Labs • Impressão 3D Premium • Email gerado automaticamente</div>
              </div>
            </body>
            </html>
          `,
          attachments
        });

        // Email de confirmação para o cliente
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: 'Recebemos a sua mensagem - XYZ Labs',
          html: `
            <!DOCTYPE html>
            <html lang="pt">
            <head>
              <meta charset="UTF-8">
              <style>
                body,p,h1,h2,div,ul,li{margin:0;padding:0;font-family:'Courier New',monospace;color:#111;}
                body{background:#f0f0f0;padding:20px;}
                .container{max-width:700px;margin:auto;background:#fff;border:4px solid #111;overflow:hidden;}
                .header{background:#111;color:#fff;padding:20px;text-align:center;letter-spacing:1px;}
                .header h1{font-size:22px;}
                .content{padding:24px;}
                .message{background:#eee;padding:16px;border:2px solid #111;white-space:pre-wrap;margin-bottom:16px;}
                .footer{background:#111;color:#fff;text-align:center;padding:16px;font-size:12px;letter-spacing:1px;}
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header"><h1>✅ Recebemos a sua mensagem</h1></div>
                <div class="content">
                  <p>Olá ${name},</p>
                  <p>Recebemos a sua mensagem e entraremos em contacto consigo em breve.</p>
                  <div class="message">
                    <h2>Resumo da sua mensagem:</h2>
                    <p><strong>Assunto:</strong> ${subjectText}</p>
                    <p>${message}</p>
                  </div>
                  <p>Para questões urgentes:</p>
                  <ul>
                    <li>📧 Email: info@xyzlabs.pt</li>
                    <li>📱 Telefone: +351 935 310 984</li>
                  </ul>
                </div>
                <div class="footer">XYZ Labs • Impressão 3D Premium • <a href="http://www.xyzlabs.pt" style="color:#fff;">www.xyzlabs.pt</a></div>
              </div>
            </body>
            </html>
          `
        });

      } catch (err) {
        console.error('Erro no envio de emails em background:', err);
      } finally {
        // Apagar ficheiros temporários
        files.forEach(file => fs.unlink(file.path, () => {}));
      }
    })();

  } catch (err) {
    console.error('Erro ao enviar email de contacto:', err);
    if (!res.headersSent) res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};
