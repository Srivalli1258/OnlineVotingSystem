export function isValidEmail(e) {
  return typeof e === 'string' && /\S+@\S+\.\S+/.test(e);
 }