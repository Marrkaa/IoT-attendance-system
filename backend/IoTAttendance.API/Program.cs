using System.Text;
using IoTAttendance.API.Data;
using IoTAttendance.API.Middleware;
using IoTAttendance.API.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// Services (DI)
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<UserService>();
builder.Services.AddScoped<RoomService>();
builder.Services.AddScoped<IoTNodeService>();
builder.Services.AddScoped<LectureService>();
builder.Services.AddScoped<ScheduleService>();
builder.Services.AddScoped<EnrollmentService>();
builder.Services.AddScoped<AttendanceService>();
builder.Services.AddScoped<StudentDeviceService>();
builder.Services.AddScoped<RouterPollingService>();
builder.Services.AddScoped<SignalProcessingService>();
builder.Services.AddScoped<RadiusService>();
builder.Services.AddScoped<AuditService>();
builder.Services.AddScoped<NotificationService>();
builder.Services.AddHostedService<SessionCleanupService>();

// Controllers + JSON
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>();
        policy.WithOrigins(origins ?? ["http://localhost:5173"])
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// Swagger / OpenAPI
builder.Services.AddOpenApi();

var app = builder.Build();

// Middleware pipeline
app.UseMiddleware<ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Configuration.GetValue("DisableHttpsRedirection", false))
{
    app.UseHttpsRedirection();
}
app.UseCors("AllowFrontend");
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

// Seed database with initial data in development
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await db.Database.EnsureCreatedAsync();

    try
    {
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE hotspot_sessions ADD COLUMN IF NOT EXISTS acct_unique_session_id character varying(128);");
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE hotspot_sessions ADD COLUMN IF NOT EXISTS last_accounting_at timestamp with time zone;");
        await db.Database.ExecuteSqlRawAsync(
            "ALTER TABLE attendance_records ALTER COLUMN schedule_id DROP NOT NULL;");
        await db.Database.ExecuteSqlRawAsync(
            "DROP INDEX IF EXISTS \"IX_attendance_records_StudentId_ScheduleId_Date\";");
        await db.Database.ExecuteSqlRawAsync(
            "DROP INDEX IF EXISTS \"IX_attendance_records_student_id_schedule_id_date\";");
        await db.Database.ExecuteSqlRawAsync(
            """CREATE UNIQUE INDEX IF NOT EXISTS "IX_attendance_records_StudentId_LectureId_Date" ON attendance_records (student_id, lecture_id, date);""");
    }
    catch
    {
        // Older DBs — ignore migration errors
    }

    if (!db.Users.Any())
    {
        var admin = new IoTAttendance.API.Models.User
        {
            Email = "admin@school.edu",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            FirstName = "System",
            LastName = "Admin",
            Role = IoTAttendance.API.Models.UserRole.Administrator
        };
        var lecturer = new IoTAttendance.API.Models.User
        {
            Email = "lecturer@school.edu",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            FirstName = "Jane",
            LastName = "Doe",
            Role = IoTAttendance.API.Models.UserRole.Lecturer
        };
        var student = new IoTAttendance.API.Models.User
        {
            Email = "student1@school.edu",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
            FirstName = "Alice",
            LastName = "Smith",
            Role = IoTAttendance.API.Models.UserRole.Student
        };

        db.Users.AddRange(admin, lecturer, student);
        await db.SaveChangesAsync();

        var room = new IoTAttendance.API.Models.Room
        {
            Name = "Room A-101",
            Capacity = 50,
            Location = "Building A, Floor 1"
        };
        db.Rooms.Add(room);
        await db.SaveChangesAsync();

        var iotNode = new IoTAttendance.API.Models.IoTNode
        {
            RoomId = room.Id,
            MacAddress = "10:11:22:33:44:01",
            Hostname = "rutx-a101",
            IpAddress = "192.168.50.1",
            Model = "Teltonika RUTX11",
            HotspotSsid = "IoT-A101",
            SignalThresholdDbm = -70,
            Status = IoTAttendance.API.Models.IoTNodeStatus.Online,
            LastSeen = DateTime.UtcNow
        };
        db.IoTNodes.Add(iotNode);

        db.RadiusAccounts.Add(new IoTAttendance.API.Models.RadiusAccount
        {
            UserId = student.Id,
            RadiusUsername = student.Email,
            RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword("password")
        });

        await db.SaveChangesAsync();

        var lecture = new IoTAttendance.API.Models.Lecture
        {
            Title = "IoT attendance (demo)",
            Description = "Demo lecture for the live attendance screen",
            LecturerId = lecturer.Id,
            RoomId = room.Id
        };
        db.Lectures.Add(lecture);
        await db.SaveChangesAsync();

        db.Enrollments.Add(new IoTAttendance.API.Models.Enrollment
        {
            StudentId = student.Id,
            LectureId = lecture.Id
        });
        await db.SaveChangesAsync();
    }

    await EnsureStudent2ForLiveDemoAsync(db);
}

app.Run();

static async Task EnsureStudent2ForLiveDemoAsync(AppDbContext db)
{
    const string email = "student2@school.edu";
    if (await db.Users.AnyAsync(u => u.Email == email))
        return;

    var student2 = new IoTAttendance.API.Models.User
    {
        Email = email,
        PasswordHash = BCrypt.Net.BCrypt.HashPassword("password"),
        FirstName = "Bob",
        LastName = "Jones",
        Role = IoTAttendance.API.Models.UserRole.Student
    };
    db.Users.Add(student2);
    await db.SaveChangesAsync();

    db.RadiusAccounts.Add(new IoTAttendance.API.Models.RadiusAccount
    {
        UserId = student2.Id,
        RadiusUsername = student2.Email,
        RadiusPasswordHash = BCrypt.Net.BCrypt.HashPassword("password")
    });
    await db.SaveChangesAsync();

    var student1 = await db.Users.FirstOrDefaultAsync(u => u.Email == "student1@school.edu");
    var lectureIds = student1 == null
        ? new List<Guid>()
        : await db.Enrollments
            .Where(e => e.StudentId == student1.Id)
            .Select(e => e.LectureId)
            .Distinct()
            .ToListAsync();

    if (lectureIds.Count == 0)
    {
        var any = await db.Lectures.Select(l => l.Id).FirstOrDefaultAsync();
        if (any != Guid.Empty)
            lectureIds.Add(any);
    }

    foreach (var lid in lectureIds)
    {
        if (await db.Enrollments.AnyAsync(e => e.StudentId == student2.Id && e.LectureId == lid))
            continue;
        db.Enrollments.Add(new IoTAttendance.API.Models.Enrollment
        {
            StudentId = student2.Id,
            LectureId = lid
        });
    }

    await db.SaveChangesAsync();
}
