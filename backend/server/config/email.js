// config/email.js
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (email, token) => {
  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Підтвердження входу до Apartica',
    html: `
      <h1>Ласкаво просимо до Apartica!</h1>
      <p>Ваш код підтвердження: <strong>${token}</strong></p>
      <p>Введіть цей код для завершення процесу входу.</p>
      <p>Код дійсний протягом 10 хвилин.</p>
    `,
  };
  
  await sgMail.send(msg);
};

module.exports = { sendVerificationEmail };