using System.Text.RegularExpressions;

namespace Todomotriz.Api.Services;

/// <summary>Validaciones compartidas; cada una lanza BusinessException con un mensaje para el usuario.</summary>
public static partial class Validate
{
    public static string Required(string? value, string campo)
    {
        if (string.IsNullOrWhiteSpace(value)) throw new BusinessException($"Falta {char.ToLower(campo[0])}{campo[1..]}.");
        return value.Trim();
    }

    public static void NotNegative(decimal value, string campo)
    {
        if (value < 0) throw new BusinessException($"{campo}: no se permiten valores negativos.");
    }

    /// <summary>Cédula / RIF venezolano: V, J, E o G + guion + 6 a 10 dígitos (ej. J-12345678)</summary>
    public static string Documento(string? value, string campo = "La cédula / RIF")
    {
        var v = Required(value, campo).ToUpperInvariant();
        if (!DocumentoRegex().IsMatch(v)) throw new BusinessException($"{campo} debe tener el formato V-12345678 (V, J, E o G y al menos 6 dígitos).");
        return v;
    }

    /// <summary>Teléfono: código de área de 4 dígitos + guion + 7 dígitos (ej. 0412-1234567). Opcional.</summary>
    public static string? Telefono(string? value)
    {
        if (string.IsNullOrWhiteSpace(value)) return null;
        var v = value.Trim();
        if (!TelefonoRegex().IsMatch(v)) throw new BusinessException("El teléfono debe tener el formato 0412-1234567.");
        return v;
    }

    public static string? Email(string? value, bool required = false)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            if (required) throw new BusinessException("El correo electrónico es obligatorio.");
            return null;
        }
        var v = value.Trim().ToLowerInvariant();
        if (!EmailRegex().IsMatch(v)) throw new BusinessException("El correo electrónico no es válido.");
        return v;
    }

    [GeneratedRegex(@"^[VJEG]-\d{6,10}$")]
    private static partial Regex DocumentoRegex();

    [GeneratedRegex(@"^\d{4}-\d{7}$")]
    private static partial Regex TelefonoRegex();

    [GeneratedRegex(@"^[^@\s]+@[^@\s]+\.[^@\s]+$")]
    private static partial Regex EmailRegex();
}
