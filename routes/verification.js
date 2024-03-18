const dns = require('dns');
const express = require('express');

const router = express.Router();

// Simple check if it's an email - has it got an @ sign in it?
const isValidEmailAddress = email => {
  return new Promise((resolve, reject) => {
    if (email.includes('@')) {
      resolve();
    } else {
      reject(new Error('Invalid email address - does not contain @ symbol'));
    }
  });
};

// Check if the lookup response contains ENOTFOUND or ENODATA - if so, it's not valid
const hasMxRecordError = error => {
  return error && (error.code === 'ENOTFOUND' || error.code === 'ENODATA');
};

// Perform an MX lookup - check if the DNS record exists
const findMxRecords = email => {
  return new Promise((resolve, reject) => {
    // Find the domain name from the email
    const [, domain] = email.split('@');

    // If we get a valid MX record response, it's a valid email
    dns.resolveMx(domain, (error, addresses) => {
      if (hasMxRecordError(error)) {
        reject(new Error('Email has invalid MX record'));
      } else {
        resolve(addresses);
      }
    });
  });
};

// Verify an email address
router.get('/email', (request, response) => {
  // Get email from the request query parameters
  const {email} = request.query;
  
  return isValidEmailAddress(email)
    .then(() => findMxRecords(email))
    .then(mxRecords => {
      return response.json({
        set_attributes: {
          emailValid: true
        }
      });
    })
    .catch(error => {
      return response.json({
        set_attributes: {
          emailValid: false,
          error: error.message
        }
      })
    });
});

module.exports = router;
