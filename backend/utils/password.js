/**
 * Validates password strength based on standard security rules.
 * @param {string} password The password to validate.
 * @returns {string[]} An array of error messages if invalid. Empty array means valid.
 */
function validatePasswordStrength(password) {
  const errors = [];
  if (!password) {
    errors.push('Vui lòng nhập mật khẩu');
    return errors;
  }
  
  if (password.length < 8) errors.push('Mật khẩu phải có ít nhất 8 ký tự');
  if (!/[a-z]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ thường');
  if (!/[A-Z]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ in hoa');
  if (!/[0-9]/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 chữ số');
  if (!/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\/~`;']/.test(password)) errors.push('Mật khẩu phải có ít nhất 1 ký tự đặc biệt');
  
  return errors;
}

module.exports = {
  validatePasswordStrength
};
