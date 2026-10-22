/**
 * Validadores rigorosos de regras de negócio brasileiras (CPF, CNPJ, Telefone, E-mail, Data)
 */

export function isValidCpf(cpf: string): boolean {
  const clean = cpf.replace(/\D/g, '')
  if (clean.length !== 11) return false
  if (/^(\d)\1{10}$/.test(clean)) return false

  let sum = 0
  for (let i = 0; i < 9; i++) {
    sum += parseInt(clean.charAt(i), 10) * (10 - i)
  }
  let rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  if (rev !== parseInt(clean.charAt(9), 10)) return false

  sum = 0
  for (let i = 0; i < 10; i++) {
    sum += parseInt(clean.charAt(i), 10) * (11 - i)
  }
  rev = 11 - (sum % 11)
  if (rev === 10 || rev === 11) rev = 0
  return rev === parseInt(clean.charAt(10), 10)
}

export function isValidCnpj(cnpj: string): boolean {
  const clean = cnpj.replace(/\D/g, '')
  if (clean.length !== 14) return false
  if (/^(\d)\1{13}$/.test(clean)) return false

  const weights1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]
  const weights2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]

  let sum = 0
  for (let i = 0; i < 12; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights1[i]
  }
  let rev = sum % 11
  const digit1 = rev < 2 ? 0 : 11 - rev
  if (digit1 !== parseInt(clean.charAt(12), 10)) return false

  sum = 0
  for (let i = 0; i < 13; i++) {
    sum += parseInt(clean.charAt(i), 10) * weights2[i]
  }
  rev = sum % 11
  const digit2 = rev < 2 ? 0 : 11 - rev
  return digit2 === parseInt(clean.charAt(13), 10)
}

export function isValidEmail(email: string): boolean {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return re.test(email.trim())
}

export function isValidPhone(phone: string): boolean {
  const clean = phone.replace(/\D/g, '')
  return clean.length >= 10 && clean.length <= 11
}

export function isValidDate(dateStr: string): boolean {
  const clean = dateStr.replace(/\D/g, '')
  if (clean.length !== 8) return false
  const day = parseInt(clean.slice(0, 2), 10)
  const month = parseInt(clean.slice(2, 4), 10)
  const year = parseInt(clean.slice(4, 8), 10)

  if (month < 1 || month > 12) return false
  if (day < 1 || day > 31) return false
  const currentYear = new Date().getFullYear()
  if (year < 1920 || year > currentYear) return false

  const dateObj = new Date(year, month - 1, day)
  return (
    dateObj.getFullYear() === year &&
    dateObj.getMonth() === month - 1 &&
    dateObj.getDate() === day
  )
}
