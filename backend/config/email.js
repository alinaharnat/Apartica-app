// config/email.js
const sgMail = require('@sendgrid/mail'); // This line should be only once

// console.log('ENV SENDGRID_API_KEY from email.js:', process.env.SENDGRID_API_KEY);
// console.log('ENV EMAIL_FROM from email.js:', process.env.EMAIL_FROM);

// Make sure the API key is set after checking its presence
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('!!! SENDGRID_API_KEY is not set in environment variables !!!');
  // You can throw an error or handle the situation where the key is not set
  // throw new Error('SENDGRID_API_KEY is not configured');
}


const sendVerificationEmail = async (email, token, name) => {
  console.log('--- sendVerificationEmail function called ---');
  console.log(`Attempting to send to: ${email}, with token: ${token}, name: ${name}`);

  if (!process.env.EMAIL_FROM) {
    console.error('!!! EMAIL_FROM is not set in environment variables. Cannot send email. !!!');
    throw new Error('Email sender (EMAIL_FROM) is not configured.');
  }
  if (!process.env.SENDGRID_API_KEY) {
    console.error('!!! SENDGRID_API_KEY is not set. Cannot send email. !!!');
    throw new Error('SendGrid API Key is not configured.');
  }

  const msg = {
    to: email,
    from: {
      email: process.env.EMAIL_FROM, // Your verified sender email in SendGrid
      name: 'Apartica Support', // Optional sender name
    },
    subject: 'Apartica Registration Confirmation', // Translated subject
    html: `
      <h1>Welcome to Apartica, ${name}!</h1>
      <p>Thank you for registering. Your email confirmation code is: <strong>${token}</strong></p>
      <p>Please enter this code in the appropriate field on the website or in the app to complete your registration.</p>
      <p>The code is valid for 1 hour.</p> 
      <p>If you did not register on Apartica, please ignore this email.</p>
    `,
    // Optional: plain text version for email clients that do not support HTML
    text: `Welcome to Apartica, ${name}!\nThank you for registering. Your email confirmation code is: ${token}\nPlease enter this code in the appropriate field on the website or in the app to complete your registration.\nThe code is valid for 1 hour.\nIf you did not register on Apartica, please ignore this email.`
  };

  console.log('Attempting to send email with data:', JSON.stringify(msg, null, 2));

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error.message); // General error description
    if (error.response) {
      // Detailed information from SendGrid API
      console.error('SendGrid Response Body:', error.response.body);
      console.error('SendGrid Response Status Code:', error.response.statusCode);
      console.error('SendGrid Response Headers:', error.response.headers);
    } else {
      // If error.response is missing, it might be a different type of error
      console.error('Error sending email (no SendGrid response):', error);
    }
    // It's important to handle the error, possibly return it or try again
    throw new Error('Failed to send confirmation email.'); // Translated error message
  }
};

module.exports = { sendVerificationEmail };
