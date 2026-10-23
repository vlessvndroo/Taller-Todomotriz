using System.Security.Claims;

namespace Todomotriz.Api.Security;

public static class ClaimsExtensions
{
    public static Guid UserId(this ClaimsPrincipal user) =>
        Guid.TryParse(user.FindFirstValue(ClaimTypes.NameIdentifier), out var id) ? id : Guid.Empty;

    public static string UserName(this ClaimsPrincipal user) => user.FindFirstValue(ClaimTypes.Name) ?? string.Empty;
}
