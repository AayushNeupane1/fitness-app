const argon2 = require('argon2');

/**
 * Hash a plain-text password for storage.
 * argon2id is the recommended variant — resistant to both GPU cracking
 * and side-channel attacks.
 */
async function hashPassword(plainPassword) {
  return argon2.hash(plainPassword, { type: argon2.argon2id });
}

/**
 * Compare a plain-text password against a stored hash.
 * Returns true/false — never throws for a wrong password.
 */
async function verifyPassword(passwordHash, plainPassword) {
  try {
    return await argon2.verify(passwordHash, plainPassword);
  } catch (error) {
    return false;
  }
}

module.exports = { hashPassword, verifyPassword };
