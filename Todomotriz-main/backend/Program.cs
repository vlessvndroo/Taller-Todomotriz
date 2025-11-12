using System.IO;
using Microsoft.EntityFrameworkCore;
using Todomotriz.Api.Data;
using Todomotriz.Api.Repositories;
using Todomotriz.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();

// Swagger with XML comments when available
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo { Title = "Todomotriz API", Version = "v1" });
    var xmlFile = $"{System.Reflection.Assembly.GetExecutingAssembly().GetName().Name}.xml";
    var xmlPath = Path.Combine(AppContext.BaseDirectory, xmlFile);
    if (File.Exists(xmlPath)) c.IncludeXmlComments(xmlPath);
});

// CORS - allow the frontend during development (adjust origin in production)
var devCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(devCorsPolicy, policy =>
    {
        policy.WithOrigins("http://localhost:5173")
              .AllowAnyHeader()
              .AllowAnyMethod();
    });
});

// DbContext - SQLite
var connectionString = builder.Configuration.GetConnectionString("Default") ?? "Data Source=todomotriz.db";
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlite(connectionString));

// Repositories
builder.Services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IProductRepository, ProductRepository>();
builder.Services.AddScoped<ISupplierRepository, SupplierRepository>();
builder.Services.AddScoped<IInvoiceRepository, InvoiceRepository>();

// Services
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IProductService, ProductService>();
builder.Services.AddScoped<ISupplierService, SupplierService>();
builder.Services.AddScoped<IInvoiceService, InvoiceService>();

var app = builder.Build();

// Ensure DB created
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    db.Database.EnsureCreated();
    // Seed database with mock data if empty
    try
    {
        DbSeeder.SeedAsync(scope.ServiceProvider).GetAwaiter().GetResult();
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error while seeding DB: {ex}");
    }
}

// Configure the HTTP request pipeline.
app.UseSwagger();
app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "Todomotriz API v1"));

app.UseHttpsRedirection();
app.UseCors(devCorsPolicy);
app.UseAuthorization();

app.MapControllers();

app.Run();
