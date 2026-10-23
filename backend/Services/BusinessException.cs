namespace Todomotriz.Api.Services;

/// <summary>
/// Error de una regla de negocio. El middleware de Program.cs lo convierte en
/// una respuesta { message } con el código HTTP indicado.
/// </summary>
public class BusinessException : Exception
{
    public int StatusCode { get; }

    public BusinessException(string message, int statusCode = StatusCodes.Status400BadRequest) : base(message)
    {
        StatusCode = statusCode;
    }

    public static BusinessException NotFound(string message) => new(message, StatusCodes.Status404NotFound);
    public static BusinessException Conflict(string message) => new(message, StatusCodes.Status409Conflict);
    public static BusinessException Forbidden(string message) => new(message, StatusCodes.Status403Forbidden);
}
