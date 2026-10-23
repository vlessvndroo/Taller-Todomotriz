using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using Microsoft.IdentityModel.Tokens;
using Todomotriz.Api.Models;

namespace Todomotriz.Api.Security;

/// <summary>Emite los tokens JWT con los que el frontend se autentica en cada petición.</summary>
public class TokenService
{
    public const string Issuer = "Todomotriz";
    public static readonly TimeSpan Duracion = TimeSpan.FromHours(12);

    private readonly SymmetricSecurityKey _key;

    public TokenService(SymmetricSecurityKey key)
    {
        _key = key;
    }

    public string CreateToken(User user)
    {
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Name, user.Nombre),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Role, user.Rol.ToLowerInvariant()),
        };

        var token = new JwtSecurityToken(
            issuer: Issuer,
            audience: Issuer,
            claims: claims,
            expires: DateTime.UtcNow.Add(Duracion),
            signingCredentials: new SigningCredentials(_key, SecurityAlgorithms.HmacSha256));

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    /// <summary>
    /// Clave de firma: usa "Jwt:Key" de la configuración si existe; si no, la genera
    /// una vez y la guarda en jwt-key.txt (ignorado por git) para que las sesiones
    /// sobrevivan a los reinicios del backend.
    /// </summary>
    public static SymmetricSecurityKey LoadOrCreateKey(IConfiguration config, string contentRoot)
    {
        var configured = config["Jwt:Key"];
        if (!string.IsNullOrWhiteSpace(configured)) return new SymmetricSecurityKey(Encoding.UTF8.GetBytes(configured));

        var path = Path.Combine(contentRoot, "jwt-key.txt");
        if (!File.Exists(path)) File.WriteAllText(path, Convert.ToBase64String(RandomNumberGenerator.GetBytes(64)));
        return new SymmetricSecurityKey(Convert.FromBase64String(File.ReadAllText(path).Trim()));
    }
}
