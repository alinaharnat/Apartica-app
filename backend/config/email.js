const sgMail = require('@sendgrid/mail');

if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
} else {
  console.error('!!! SENDGRID_API_KEY is not set in environment variables !!!');
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
      email: process.env.EMAIL_FROM,
      name: 'Apartica Support',
    },
    subject: 'Apartica Registration Confirmation',
    html: `
      <h1>Welcome to Apartica, ${name}!</h1>
      <p>Thank you for registering. Your email confirmation code is: <strong>${token}</strong></p>
      <p>Please enter this code in the appropriate field on the website or in the app to complete your registration.</p>
      <p>The code is valid for 1 hour.</p> 
      <p>If you did not register on Apartica, please ignore this email.</p>
    `,
    text: `Welcome to Apartica, ${name}!\nThank you for registering. Your email confirmation code is: ${token}\nPlease enter this code in the appropriate field on the website or in the app to complete your registration.\nThe code is valid for 1 hour.\nIf you did not register on Apartica, please ignore this email.`
  };

  console.log('Attempting to send email with data:', JSON.stringify(msg, null, 2));

  try {
    await sgMail.send(msg);
    console.log(`Verification email sent to ${email}`);
  } catch (error) {
    console.error('Error sending verification email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
      console.error('SendGrid Response Status Code:', error.response.statusCode);
      console.error('SendGrid Response Headers:', error.response.headers);
    } else {
      console.error('Error sending email (no SendGrid response):', error);
    }
    throw new Error('Failed to send confirmation email.');
  }
};

const sendBookingConfirmationEmail = async (email, fullGuestName, propertyName) => {
  console.log('--- sendBookingConfirmationEmail function called ---');
  console.log(`Attempting to send to: ${email}, fullGuestName: ${fullGuestName}, propertyName: ${propertyName}`);

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
      email: process.env.EMAIL_FROM,
      name: 'Apartica Support',
    },
    subject: 'Your Booking Confirmation with Apartica',
    html: `
      <h1>Congratulations, ${fullGuestName}!</h1>
      <p>Your booking at <strong>${propertyName}</strong> has been successfully created.</p>
      <p>You will receive another email once something changes with your booking.</p>
      <p>Thank you for choosing Apartica! If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>Apartica Team</p>
    `,
    text: `Congratulations, ${fullGuestName}!\nYour booking at ${propertyName} has been successfully created.\nYou will receive another email once the property owner confirms your booking.\nThank you for choosing Apartica! If you have any questions, feel free to contact our support team.\nBest regards,\nApartica Team`
  };

  console.log('Attempting to send booking confirmation email with data:', JSON.stringify(msg, null, 2));

  try {
    await sgMail.send(msg);
    console.log(`Booking confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending booking confirmation email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
      console.error('SendGrid Response Status Code:', error.response.statusCode);
      console.error('SendGrid Response Headers:', error.response.headers);
    } else {
      console.error('Error sending email (no SendGrid response):', error);
    }
    throw new Error('Failed to send booking confirmation email.');
  }
};

const sendBookingCancellationEmail = async (email, fullGuestName, propertyName, refundAmount) => {
  console.log('--- sendBookingCancellationEmail function called ---');
  console.log(`Attempting to send to: ${email}, fullGuestName: ${fullGuestName}, propertyName: ${propertyName}, refundAmount: ${refundAmount}`);

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
      email: process.env.EMAIL_FROM,
      name: 'Apartica Support',
    },
    subject: 'Your Booking Cancellation with Apartica',
    html: `
      <h1>Hello, ${fullGuestName}!</h1>
      <p>Your booking at <strong>${propertyName}</strong> has been successfully cancelled.</p>
      <p>A refund of <strong>€${refundAmount.toFixed(2)}</strong> has been processed and will be credited to your original payment method.</p>
      <p>Thank you for choosing Apartica! If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>Apartica Team</p>
    `,
    text: `Hello, ${fullGuestName}!\nYour booking at ${propertyName} has been successfully cancelled.\nA refund of €${refundAmount.toFixed(2)} has been processed and will be credited to your original payment method.\nThank you for choosing Apartica! If you have any questions, feel free to contact our support team.\nBest regards,\nApartica Team`
  };

  console.log('Attempting to send booking cancellation email with data:', JSON.stringify(msg, null, 2));

  try {
    await sgMail.send(msg);
    console.log(`Booking cancellation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
      console.error('SendGrid Response Status Code:', error.response.statusCode);
      console.error('SendGrid Response Headers:', error.response.headers);
    } else {
      console.error('Error sending email (no SendGrid response):', error);
    }
    throw new Error('Failed to send booking cancellation email.');
  }
};

const sendBookingOwnerCancellationEmail = async (email, fullGuestName, propertyName, refundAmount) => {
  console.log('--- sendBookingOwnerCancellationEmail function called ---');
  console.log(`Attempting to send to: ${email}, fullGuestName: ${fullGuestName}, propertyName: ${propertyName}, refundAmount: ${refundAmount}`);

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
      email: process.env.EMAIL_FROM,
      name: 'Apartica Support',
    },
    subject: 'Your Booking Cancellation with Apartica',
    html: `
      <h1>Hello, ${fullGuestName}!</h1>
      <p>We are sorry to inform you that your booking at <strong>${propertyName}</strong> has been cancelled by owner.</p>
      <p>A refund of full booking price (<strong>€${refundAmount.toFixed(2)}</strong>) has been processed and will be credited to your original payment method.</p>
      <p>Sorry for any inconveniences. If you have any questions, feel free to contact our support team.</p>
      <p>Best regards,<br>Apartica Team</p>
    `,
    text: `Hello, ${fullGuestName}!\nWe are sorry to inform you that your booking at ${propertyName} has been cancelled by owner.\nA refund of full booking price (€${refundAmount.toFixed(2)}) has been processed and will be credited to your original payment method.\nSorry for any inconveniences. If you have any questions, feel free to contact our support team.\nBest regards,\nApartica Team`
  };

  console.log('Attempting to send booking cancellation email with data:', JSON.stringify(msg, null, 2));

  try {
    await sgMail.send(msg);
    console.log(`Booking cancellation email sent to ${email}`);
  } catch (error) {
    console.error('Error sending booking cancellation email:', error.message);
    if (error.response) {
      console.error('SendGrid Response Body:', error.response.body);
      console.error('SendGrid Response Status Code:', error.response.statusCode);
      console.error('SendGrid Response Headers:', error.response.headers);
    } else {
      console.error('Error sending email (no SendGrid response):', error);
    }
    throw new Error('Failed to send booking cancellation email.');
  }
};

module.exports = { sendVerificationEmail, sendBookingConfirmationEmail, sendBookingCancellationEmail, sendBookingOwnerCancellationEmail };