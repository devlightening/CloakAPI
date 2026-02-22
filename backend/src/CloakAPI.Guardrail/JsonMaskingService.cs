using System.Text.Json;
using System.Text.Json.Nodes;

namespace CloakAPI.Guardrail;

public sealed class JsonMaskingService
{
    private static readonly HashSet<string> EmailKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "email",
        "emailAddress",
        "mail"
    };

    private static readonly HashSet<string> PhoneKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "phone",
        "phoneNumber",
        "mobile",
        "msisdn"
    };

    private static readonly HashSet<string> TcknKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "tckn",
        "tc",
        "turkishId",
        "nationalId"
    };

    private static readonly HashSet<string> IpKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "ip",
        "ipAddress",
        "clientIp"
    };

    private static readonly HashSet<string> NotesKeys = new(StringComparer.OrdinalIgnoreCase)
    {
        "notes",
        "note",
        "comment",
        "description",
        "message"
    };

    public (string MaskedJson, MaskingReport Report) MaskJson(string json)
    {
        var node = JsonNode.Parse(json);
        if (node is null)
        {
            return (json, new MaskingReport(0, Array.Empty<string>(), Array.Empty<string>()));
        }

        var maskedFields = new List<string>();
        var piiTypes = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        var maskedCount = 0;

        MaskNode(node, parentPropertyName: null, path: "$", maskedFields, piiTypes, ref maskedCount);

        var maskedJson = node.ToJsonString(new JsonSerializerOptions { WriteIndented = false });
        return (maskedJson, new MaskingReport(maskedCount, piiTypes.ToArray(), maskedFields));
    }

    private static void MaskNode(
        JsonNode node,
        string? parentPropertyName,
        string path,
        List<string> maskedFields,
        HashSet<string> piiTypes,
        ref int maskedCount)
    {
        if (node is JsonObject obj)
        {
            var keys = obj.Select(kvp => kvp.Key).ToList();
            foreach (var key in keys)
            {
                var child = obj[key];
                if (child is null) continue;

                if (IsLocationObject(key, child))
                {
                    RoundLocation(child);
                    piiTypes.Add("Location");
                    maskedFields.Add(path + "." + key);
                    maskedCount++;
                    continue;
                }

                MaskNode(child, key, path + "." + key, maskedFields, piiTypes, ref maskedCount);
            }

            return;
        }

        if (node is JsonArray arr)
        {
            for (var i = 0; i < arr.Count; i++)
            {
                var item = arr[i];
                if (item is null) continue;
                MaskNode(item, parentPropertyName, path + "[" + i + "]", maskedFields, piiTypes, ref maskedCount);
            }

            return;
        }

        if (node is JsonValue value)
        {
            var str = value.TryGetValue<string>(out var s) ? s : null;
            if (str is null) return;

            if (!string.IsNullOrWhiteSpace(parentPropertyName))
            {
                if (EmailKeys.Contains(parentPropertyName))
                {
                    node.ReplaceWith(PiiMasker.MaskEmail(str));
                    piiTypes.Add("Email");
                    maskedFields.Add(path);
                    maskedCount++;
                    return;
                }

                if (PhoneKeys.Contains(parentPropertyName))
                {
                    node.ReplaceWith(PiiMasker.MaskPhone(str));
                    piiTypes.Add("Phone");
                    maskedFields.Add(path);
                    maskedCount++;
                    return;
                }

                if (TcknKeys.Contains(parentPropertyName))
                {
                    node.ReplaceWith(PiiMasker.MaskTckn(str));
                    piiTypes.Add("TCKN");
                    maskedFields.Add(path);
                    maskedCount++;
                    return;
                }

                if (IpKeys.Contains(parentPropertyName))
                {
                    node.ReplaceWith(PiiMasker.MaskIpv4(str));
                    piiTypes.Add("IP");
                    maskedFields.Add(path);
                    maskedCount++;
                    return;
                }

                if (NotesKeys.Contains(parentPropertyName))
                {
                    var masked = PiiDetector.MaskAllInFreeText(str);
                    if (!string.Equals(masked, str, StringComparison.Ordinal))
                    {
                        piiTypes.UnionWith(DetectPiiTypes(str));
                        maskedFields.Add(path);
                        maskedCount++;
                    }

                    node.ReplaceWith(masked);
                    return;
                }
            }

            var freeTextMasked = PiiDetector.MaskAllInFreeText(str);
            if (!string.Equals(freeTextMasked, str, StringComparison.Ordinal))
            {
                piiTypes.UnionWith(DetectPiiTypes(str));
                maskedFields.Add(path);
                maskedCount++;
            }

            node.ReplaceWith(freeTextMasked);
        }
    }

    private static IEnumerable<string> DetectPiiTypes(string input)
    {
        var found = new HashSet<string>(StringComparer.OrdinalIgnoreCase);
        if (PiiDetector.ContainsEmail(input)) found.Add("Email");
        if (PiiDetector.ContainsPhone(input)) found.Add("Phone");
        if (PiiDetector.ContainsTckn(input)) found.Add("TCKN");
        if (PiiDetector.ContainsIpv4(input)) found.Add("IP");
        return found;
    }

    private static bool IsLocationObject(string propertyName, JsonNode node)
    {
        if (!propertyName.Equals("location", StringComparison.OrdinalIgnoreCase)) return false;
        if (node is not JsonObject obj) return false;
        return obj.ContainsKey("lat") && obj.ContainsKey("lon");
    }

    private static void RoundLocation(JsonNode locationNode)
    {
        if (locationNode is not JsonObject obj) return;

        if (obj["lat"] is JsonValue latVal)
        {
            if (latVal.TryGetValue<double>(out var latD))
            {
                obj["lat"] = PiiMasker.RoundLocationComponent(latD);
            }
            else if (latVal.TryGetValue<string>(out var latS) && PiiMasker.TryRoundLocationComponent(latS, out var roundedLat))
            {
                obj["lat"] = roundedLat;
            }
        }

        if (obj["lon"] is JsonValue lonVal)
        {
            if (lonVal.TryGetValue<double>(out var lonD))
            {
                obj["lon"] = PiiMasker.RoundLocationComponent(lonD);
            }
            else if (lonVal.TryGetValue<string>(out var lonS) && PiiMasker.TryRoundLocationComponent(lonS, out var roundedLon))
            {
                obj["lon"] = roundedLon;
            }
        }
    }
}
