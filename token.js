const jwt = require('jsonwebtoken');

/**
 * Generates a JWT token with an empty payload.
 * @param {String} secretKey - The secret key to sign the token.
 * @returns {String} - The generated JWT token.
 */
function generateToken(secretKey) {
    const payload = {}; // Empty payload

    const token = jwt.sign(payload, secretKey); // No payload content, no expiration
    return token;
}

// Example usage:
const secretKey = 'hello'; // Replace with your secret key
const token = generateToken(secretKey);

console.log('Generated JWT Token:', token);
