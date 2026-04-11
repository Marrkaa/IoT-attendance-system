namespace IoTAttendance.API.Services;

/// <summary>
/// Handles sending notifications (email, push) to users.
/// Currently uses console logging as placeholder until SMTP is configured.
/// In production: configure SMTP settings in appsettings.json and use SmtpClient.
/// </summary>
public class NotificationService
{
    private readonly IConfiguration _config;
    private readonly ILogger<NotificationService> _logger;

    public NotificationService(IConfiguration config, ILogger<NotificationService> logger)
    {
        _config = config;
        _logger = logger;
    }

    /// <summary>
    /// Send password reset email with token link.
    /// </summary>
    public async Task SendPasswordResetEmailAsync(string email, string resetToken)
    {
        var frontendUrl = _config["Cors:AllowedOrigins:0"] ?? "http://localhost:5173";
        var resetLink = $"{frontendUrl}/reset-password/{resetToken}";

        _logger.LogInformation(
            "Password reset requested for {Email}. Link: {Link}",
            email, resetLink);

        // TODO: Replace with real SMTP email sending
        // var smtpHost = _config["Email:SmtpHost"];
        // var smtpPort = int.Parse(_config["Email:SmtpPort"] ?? "587");
        // var smtpUser = _config["Email:Username"];
        // var smtpPass = _config["Email:Password"];
        //
        // using var client = new SmtpClient(smtpHost, smtpPort);
        // client.Credentials = new NetworkCredential(smtpUser, smtpPass);
        // client.EnableSsl = true;
        //
        // var message = new MailMessage
        // {
        //     From = new MailAddress("noreply@iot-attendance.lt"),
        //     Subject = "Password reset - IoT Attendance",
        //     Body = BuildResetEmailBody(resetLink),
        //     IsBodyHtml = true
        // };
        // message.To.Add(email);
        // await client.SendMailAsync(message);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Send welcome email after registration.
    /// </summary>
    public async Task SendWelcomeEmailAsync(string email, string firstName)
    {
        _logger.LogInformation(
            "Welcome email sent to {Email} ({Name})",
            email, firstName);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Notify lecturer about low attendance for their lecture.
    /// </summary>
    public async Task SendLowAttendanceAlertAsync(
        string lecturerEmail,
        string lectureName,
        double attendancePercent)
    {
        _logger.LogInformation(
            "Low attendance alert: {Lecture} at {Percent}% → {Email}",
            lectureName, attendancePercent, lecturerEmail);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Notify student about their attendance dropping below threshold.
    /// </summary>
    public async Task SendAttendanceWarningAsync(
        string studentEmail,
        string studentName,
        double attendancePercent,
        double threshold)
    {
        _logger.LogInformation(
            "Attendance warning: {Name} at {Percent}% (threshold: {Threshold}%) → {Email}",
            studentName, attendancePercent, threshold, studentEmail);

        await Task.CompletedTask;
    }

    /// <summary>
    /// Notify admin about IoT node going offline.
    /// </summary>
    public async Task SendNodeOfflineAlertAsync(
        string adminEmail,
        string nodeHostname,
        string roomName)
    {
        _logger.LogInformation(
            "Node offline: {Node} in {Room} → {Email}",
            nodeHostname, roomName, adminEmail);

        await Task.CompletedTask;
    }
}
