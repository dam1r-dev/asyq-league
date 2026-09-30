/** Самые частые пароли: их перебирают в первую очередь. */
const COMMON = new Set([
  "12345678", "123456789", "1234567890", "qwertyui", "qwerty123", "password", "password1", "password123",
  "11111111", "00000000", "12341234", "87654321", "iloveyou", "abc12345", "asdfghjk", "qazwsxedc",
  "1q2w3e4r", "1qaz2wsx", "zxcvbnm1", "qwertyuiop", "adminadmin", "letmein1", "welcome1", "kazakhstan",
  "qazaqstan", "asyq2026", "asyqleague", "narxoz123", "12345qwert", "йцукенгш", "qwe12345",
]);

/** Пароль годится, если он не из списка частых и не совпадает с логином. */
export function isWeakPassword(password: string, username: string) {
  const p = password.toLowerCase();
  return COMMON.has(p) || p === username.toLowerCase() || /^(.)\1+$/.test(p);
}
