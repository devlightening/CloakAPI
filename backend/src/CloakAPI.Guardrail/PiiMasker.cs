using System.Globalization;

namespace CloakAPI.Guardrail;

public static class PiiMasker
{
    public static string MaskEmail(string email)
    {
        var at = email.IndexOf('@');
        if (at <= 1) return "***";

        var local = email[..at];
        var domain = email[(at + 1)..];

        var keep = Math.Min(2, local.Length);
        var maskedLocal = local[..keep] + new string('*', Math.Max(3, local.Length - keep));
        return maskedLocal + "@" + domain;
    }

    public static string MaskPhone(string phone)
    {
        var digits = new string(phone.Where(char.IsDigit).ToArray());
        if (digits.Length < 4) return "***";
        var last4 = digits[^4..];
        return "***-***-" + last4;
    }

    public static string MaskTckn(string tckn)
    {
        var digits = new string(tckn.Where(char.IsDigit).ToArray());
        if (digits.Length != 11) return "***********";
        return new string('*', 9) + digits[^2..];
    }

    public static string MaskIpv4(string ip)
    {
        var parts = ip.Split('.');
        if (parts.Length != 4) return "***.***.***.***";
        return $"{parts[0]}.***.***.{parts[3]}";
    }

    public static double RoundLocationComponent(double value) =>
        Math.Round(value, 2, MidpointRounding.AwayFromZero);

    public static bool TryRoundLocationComponent(string value, out string rounded)
    {
        if (double.TryParse(value, NumberStyles.Float, CultureInfo.InvariantCulture, out var d))
        {
            rounded = RoundLocationComponent(d).ToString("0.##", CultureInfo.InvariantCulture);
            return true;
        }

        rounded = value;
        return false;
    }
}
