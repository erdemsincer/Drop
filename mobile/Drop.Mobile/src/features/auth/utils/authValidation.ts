export type AuthFormErrors = Record<string, string>;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateLogin(email: string, password: string): AuthFormErrors {
  const errors: AuthFormErrors = {};
  if (!email.trim()) errors.email = 'E-posta zorunludur.';
  else if (!emailPattern.test(email.trim())) errors.email = 'Geçerli bir e-posta girin.';
  if (!password) errors.password = 'Şifre zorunludur.';
  return errors;
}

export function validateRegister(firstName: string, lastName: string, email: string, password: string): AuthFormErrors {
  const errors = validateLogin(email, password);
  if (!firstName.trim()) errors.firstName = 'Ad zorunludur.';
  if (!lastName.trim()) errors.lastName = 'Soyad zorunludur.';
  if (password && password.length < 8) errors.password = 'Şifre en az 8 karakter olmalıdır.';
  return errors;
}
