const EmailService = {
  async send(record) {
    const config = Storage.getConfig();
    if (!config.autoSend || !config.gmail) return false;

    const message = this.formatMessage(record);

    switch(config.service) {
      case 'emailjs':
        return this.sendEmailJS(record, config.gmail, message);
      case 'smtpjs':
        return this.sendSMTPJS(record, config.gmail, message);
      case 'backend':
        return this.sendBackend(record, config.gmail, message);
      default:
        return false;
    }
  },

  formatMessage(record) {
    return `
NOVO REGISTRO - CONTROLE DE ENTRADA DE RESÍDUOS - ECOPONTO

Data: ${record.data}
Horário: ${record.horario}
Placa: ${record.placa}
Modelo: ${record.modelo}
Responsável: ${record.responsavel}
Tipo de Veículo: ${record.tipoVeiculo}
Resíduos: ${record.residuos.join(', ')}
Observação: ${record.observacao || 'Nenhuma'}

---
Enviado automaticamente pelo Sistema Ecoponto
    `.trim();
  },

  sendEmailJS(record, toEmail, message) {
    // EmailJS implementation - needs EmailJS account and keys
    // https://www.emailjs.com/
    if (typeof emailjs === 'undefined') {
      console.warn('EmailJS not loaded. Include https://cdn.jsdelivr.net/npm/emailjs-com@3/dist/email.min.js');
      return false;
    }

    const templateParams = {
      to_email: toEmail,
      from_name: 'Sistema Ecoponto',
      subject: `Novo Registro - ${record.placa}`,
      message: message
    };

    return emailjs.send('service_m0z1z0k', 'template_zbh9lsi', templateParams, 'LtcUqfYQ0WG0NLC3V')
      .then(() => true)
      .catch(e => {
        console.error('EmailJS error:', e);
        return false;
      });
  },

  sendSMTPJS(record, toEmail, message) {
    // SMTP.js implementation - https://smtpjs.com/
    if (typeof Email === 'undefined') {
      console.warn('SMTP.js not loaded. Include https://smtpjs.com/v3/smtp.js');
      return false;
    }

    return new Promise((resolve) => {
      Email.send({
        SecureToken: "YOUR_SMTPJS_TOKEN", // Get from smtpjs.com
        To: toEmail,
        From: "seu-email@exemplo.com",
        Subject: `Novo Registro Ecoponto - ${record.placa}`,
        Body: message.replace(/\n/g, '<br>')
      }).then(() => resolve(true))
        .catch(e => {
          console.error('SMTP.js error:', e);
          resolve(false);
        });
    });
  },

  sendBackend(record, toEmail, message) {
    // Placeholder for future backend integration
    console.log('Backend send:', { record, toEmail, message });
    return Promise.resolve(true);
  }
};
