/**
 * Gerador de Payload PIX Padrão BACEN (BR Code EMV) com cálculo de CRC16-CCITT
 */

interface GeneratePixParams {
  pixKey: string
  merchantName: string
  merchantCity: string
  amount: number
  txid: string
}

function formatEmvField(id: string, value: string): string {
  const len = value.length.toString().padStart(2, '0')
  return `${id}${len}${value}`
}

function calculateCrc16(payload: string): string {
  let crc = 0xffff
  const polynomial = 0x1021

  for (let i = 0; i < payload.length; i++) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ polynomial
      } else {
        crc <<= 1
      }
      crc &= 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export function generatePixEmv({
  pixKey,
  merchantName,
  merchantCity,
  amount,
  txid,
}: GeneratePixParams): string {
  const cleanKey = pixKey.trim()
  const cleanName = merchantName.slice(0, 25).trim()
  const cleanCity = merchantCity.slice(0, 15).trim()
  const formattedAmount = amount.toFixed(2)

  // Subcampos do Merchant Account Information (ID 26)
  const gui = formatEmvField('00', 'br.gov.bcb.pix')
  const keyField = formatEmvField('01', cleanKey)
  const merchantAccount = formatEmvField('26', `${gui}${keyField}`)

  // Subcampos do Additional Data Field (ID 62)
  const txidField = formatEmvField('05', txid || '***')
  const additionalData = formatEmvField('62', txidField)

  const payloadWithoutCrc = [
    formatEmvField('00', '01'), // Payload Format Indicator
    merchantAccount,
    formatEmvField('52', '0000'), // Merchant Category Code
    formatEmvField('53', '986'), // Currency BRL
    formatEmvField('54', formattedAmount), // Amount
    formatEmvField('58', 'BR'), // Country Code
    formatEmvField('59', cleanName), // Merchant Name
    formatEmvField('60', cleanCity), // Merchant City
    additionalData,
    '6304', // CRC placeholder
  ].join('')

  const crc = calculateCrc16(payloadWithoutCrc)
  return `${payloadWithoutCrc}${crc}`
}

export const DEFAULT_PIX_SUBSCRIPTION = {
  key: 'financeiro@nomelimpo.express',
  name: 'NOME LIMPO GESTAO LTDA',
  city: 'BELO HORIZONTE',
  amount: 100.0,
}
