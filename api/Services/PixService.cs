using System.Text;

namespace NomeLimpo.Api.Services;

public class PixService
{
    public (string emv, string qrCodeUrl) GerarPixEmv(string chavePix, string recebedor, string cidade, decimal valor, string txid)
    {
        var cleanKey = chavePix.Trim();
        var cleanRecebedor = recebedor.Length > 25 ? recebedor[..25] : recebedor;
        var cleanCidade = cidade.Length > 15 ? cidade[..15] : cidade;
        var cleanTxid = string.IsNullOrWhiteSpace(txid) ? "***" : (txid.Length > 25 ? txid[..25] : txid);
        var valorFormatado = valor.ToString("F2", System.Globalization.CultureInfo.InvariantCulture);

        // Merchant Account Information (ID 26)
        var gui = FormatarCampo("00", "br.gov.bcb.pix");
        var chave = FormatarCampo("01", cleanKey);
        var mai = FormatarCampo("26", gui + chave);

        // Additional Data Field Template (ID 62)
        var refLabel = FormatarCampo("05", cleanTxid);
        var additionalData = FormatarCampo("62", refLabel);

        var payload =
            FormatarCampo("00", "01") + // Payload Format Indicator
            FormatarCampo("01", "12") + // Point of Initiation: 12 (Dinâmico/Recorrente) ou 11 (Estático)
            mai +
            FormatarCampo("52", "0000") + // Merchant Category Code
            FormatarCampo("53", "986") +  // Transaction Currency (986 = BRL)
            FormatarCampo("54", valorFormatado) + // Transaction Amount
            FormatarCampo("58", "BR") +   // Country Code
            FormatarCampo("59", cleanRecebedor) +
            FormatarCampo("60", cleanCidade) +
            additionalData +
            "6304"; // CRC16 Tag

        var crc = CalcularCrc16(payload);
        var finalEmv = payload + crc;
        var qrCodeUrl = $"https://api.qrserver.com/v1/create-qr-code/?size=300x300&data={Uri.EscapeDataString(finalEmv)}";

        return (finalEmv, qrCodeUrl);
    }

    private static string FormatarCampo(string id, string valor)
    {
        var len = Encoding.UTF8.GetByteCount(valor).ToString("D2");
        return $"{id}{len}{valor}";
    }

    private static string CalcularCrc16(string input)
    {
        var bytes = Encoding.UTF8.GetBytes(input);
        ushort crc = 0xFFFF;
        const ushort polynomial = 0x1021;

        foreach (var b in bytes)
        {
            for (int i = 0; i < 8; i++)
            {
                bool bit = ((b >> (7 - i)) & 1) == 1;
                bool c15 = ((crc >> 15) & 1) == 1;
                crc <<= 1;
                if (c15 ^ bit) crc ^= polynomial;
            }
        }

        crc &= 0xFFFF;
        return crc.ToString("X4");
    }
}
