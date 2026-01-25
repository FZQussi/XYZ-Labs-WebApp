// Backend/controllers/contact.controller.js
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ===== SEND CONTACT MESSAGE =====
exports.sendContactMessage = async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const files = req.files || [];

    // Validações
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ error: 'Campos obrigatórios em falta' });
    }

    // Preparar attachments
    const attachments = files.map(file => ({
      filename: file.originalname,
      path: file.path
    }));

    // Subject mapping
    const subjectMap = {
      'custom': 'Peça Personalizada',
      'quote': 'Pedido de Orçamento',
      'support': 'Suporte Técnico',
      'info': 'Informações Gerais',
      'partnership': 'Parcerias',
      'other': 'Outro'
    };

    const subjectText = subjectMap[subject] || subject;

    // Email para admin
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL,
      subject: `📧 Novo Contacto: ${subjectText} - ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Nova Mensagem de Contacto</h2>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Nome:</strong> ${name}</p>
            <p><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
            ${phone ? `<p><strong>Telefone:</strong> ${phone}</p>` : ''}
            <p><strong>Assunto:</strong> ${subjectText}</p>
          </div>

          <div style="background-color: #fff; padding: 20px; border-left: 4px solid #4CAF50; margin: 20px 0;">
            <h3>Mensagem:</h3>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          ${files.length > 0 ? `
            <div style="margin: 20px 0;">
              <h3>Ficheiros Anexados:</h3>
              <ul>
                ${files.map(f => `<li>${f.originalname} (${(f.size / 1024).toFixed(1)} KB)</li>`).join('')}
              </ul>
            </div>
          ` : ''}

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 0.9em;">
            <em>Enviado automaticamente através do formulário de contacto do site XYZ Labs</em>
          </p>
        </div>
      `,
      attachments: attachments
    });

    // Email de confirmação para o cliente
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Recebemos a sua mensagem - XYZ Labs',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4CAF50;">Obrigado pelo seu contacto!</h2>
          
          <p>Olá ${name},</p>
          
          <p>Recebemos a sua mensagem e entraremos em contacto consigo em breve (normalmente em 24 horas úteis).</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Resumo da sua mensagem:</h3>
            <p><strong>Assunto:</strong> ${subjectText}</p>
            <p style="white-space: pre-wrap;">${message}</p>
          </div>

          <p>Se tiver alguma questão urgente, pode contactar-nos diretamente:</p>
          <ul>
            <li>📧 Email: info@xyzlabs.pt</li>
            <li>📱 Telefone: +351 912 345 678</li>
          </ul>

          <p>Atentamente,<br>
          <strong>Equipa XYZ Labs</strong></p>

          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          
          <p style="color: #666; font-size: 0.9em; text-align: center;">
            XYZ Labs - Impressão 3D Premium<br>
            <a href="http://www.xyzlabs.pt">www.xyzlabs.pt</a>
          </p>
        </div>
      `
    });

    res.json({
      success: true,
      message: 'Mensagem enviada com sucesso!'
    });

  } catch (err) {
    console.error('Erro ao enviar email de contacto:', err);
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
};