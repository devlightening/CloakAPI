using System.Text.RegularExpressions;

namespace CloakAPI.Guardrail;

public static partial class PiiDetector
{
    private static readonly Regex EmailRegex = new(
        @"(?i)\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b",
        RegexOptions.Compiled);

    private static readonly Regex PhoneRegex = new(
        @"\b(?:\+?\d{1,3}[\s-]?)?(?:\(?\d{3}\)?[\s-]?)\d{3}[\s-]?\d{4}\b",
        RegexOptions.Compiled);

    private static readonly Regex TcknRegex = new(
        @"\b\d{11}\b",
        RegexOptions.Compiled);

    private static readonly Regex Ipv4Regex = new(
        @"\b(?:(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\.){3}(?:25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)\b",
        RegexOptions.Compiled);

    public static bool ContainsEmail(string input) => EmailRegex.IsMatch(input);
    public static bool ContainsPhone(string input) => PhoneRegex.IsMatch(input);
    public static bool ContainsTckn(string input) => TcknRegex.IsMatch(input);
    public static bool ContainsIpv4(string input) => Ipv4Regex.IsMatch(input);

    public static string MaskEmailsInText(string input, Func<string, string> masker) =>
        EmailRegex.Replace(input, m => masker(m.Value));

    public static string MaskPhonesInText(string input, Func<string, string> masker) =>
        PhoneRegex.Replace(input, m => masker(m.Value));

    public static string MaskTcknInText(string input, Func<string, string> masker) =>
        TcknRegex.Replace(input, m => masker(m.Value));

    public static string MaskIpv4InText(string input, Func<string, string> masker) =>
        Ipv4Regex.Replace(input, m => masker(m.Value));

    public static string MaskAllInFreeText(string input)
    {
        var output = input;
        output = MaskEmailsInText(output, PiiMasker.MaskEmail);
        output = MaskPhonesInText(output, PiiMasker.MaskPhone);
        output = MaskTcknInText(output, PiiMasker.MaskTckn);
        output = MaskIpv4InText(output, PiiMasker.MaskIpv4);
        return output;
    }
}
