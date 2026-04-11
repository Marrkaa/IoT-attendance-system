using IoTAttendance.API.Models;
using Microsoft.EntityFrameworkCore;

namespace IoTAttendance.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<Room> Rooms => Set<Room>();
    public DbSet<IoTNode> IoTNodes => Set<IoTNode>();
    public DbSet<Lecture> Lectures => Set<Lecture>();
    public DbSet<Schedule> Schedules => Set<Schedule>();
    public DbSet<Enrollment> Enrollments => Set<Enrollment>();
    public DbSet<AttendanceRecord> AttendanceRecords => Set<AttendanceRecord>();
    public DbSet<StudentDevice> StudentDevices => Set<StudentDevice>();
    public DbSet<RadiusAccount> RadiusAccounts => Set<RadiusAccount>();
    public DbSet<WifiConnectionLog> WifiConnectionLogs => Set<WifiConnectionLog>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<HotspotSession> HotspotSessions => Set<HotspotSession>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User
        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.Property(u => u.Role).HasConversion<string>();
        });

        // Room - one-to-one with IoTNode
        modelBuilder.Entity<Room>(entity =>
        {
            entity.HasOne(r => r.IoTNode)
                  .WithOne(n => n.Room)
                  .HasForeignKey<IoTNode>(n => n.RoomId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // IoTNode
        modelBuilder.Entity<IoTNode>(entity =>
        {
            entity.HasIndex(n => n.MacAddress).IsUnique();
            entity.Property(n => n.Status).HasConversion<string>();
        });

        // Lecture
        modelBuilder.Entity<Lecture>(entity =>
        {
            entity.HasOne(l => l.Lecturer)
                  .WithMany(u => u.LecturesAsLecturer)
                  .HasForeignKey(l => l.LecturerId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(l => l.Room)
                  .WithMany(r => r.Lectures)
                  .HasForeignKey(l => l.RoomId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // Enrollment - unique student+lecture
        modelBuilder.Entity<Enrollment>(entity =>
        {
            entity.HasIndex(e => new { e.StudentId, e.LectureId }).IsUnique();

            entity.HasOne(e => e.Student)
                  .WithMany(u => u.Enrollments)
                  .HasForeignKey(e => e.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(e => e.Lecture)
                  .WithMany(l => l.Enrollments)
                  .HasForeignKey(e => e.LectureId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // AttendanceRecord - unique student+lecture+date
        modelBuilder.Entity<AttendanceRecord>(entity =>
        {
            entity.HasIndex(a => new { a.StudentId, a.LectureId, a.Date }).IsUnique();
            entity.Property(a => a.Status).HasConversion<string>();

            entity.HasOne(a => a.Student)
                  .WithMany(u => u.AttendanceRecords)
                  .HasForeignKey(a => a.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(a => a.Lecture)
                  .WithMany(l => l.AttendanceRecords)
                  .HasForeignKey(a => a.LectureId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(a => a.Schedule)
                  .WithMany()
                  .HasForeignKey(a => a.ScheduleId)
                  .IsRequired(false)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        // StudentDevice - unique MAC per student
        modelBuilder.Entity<StudentDevice>(entity =>
        {
            entity.HasIndex(d => d.MacAddress).IsUnique();

            entity.HasOne(d => d.Student)
                  .WithMany(u => u.StudentDevices)
                  .HasForeignKey(d => d.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // RadiusAccount - one-to-one with User
        modelBuilder.Entity<RadiusAccount>(entity =>
        {
            entity.HasIndex(r => r.RadiusUsername).IsUnique();
            entity.HasIndex(r => r.UserId).IsUnique();

            entity.HasOne(r => r.User)
                  .WithOne(u => u.RadiusAccount)
                  .HasForeignKey<RadiusAccount>(r => r.UserId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        // WifiConnectionLog
        modelBuilder.Entity<WifiConnectionLog>(entity =>
        {
            entity.Property(w => w.EventType).HasConversion<string>();
            entity.HasIndex(w => w.Timestamp);
            entity.HasIndex(w => w.ClientMacAddress);
        });

        // AuditLog
        modelBuilder.Entity<AuditLog>(entity =>
        {
            entity.Property(a => a.Action).HasConversion<string>();
            entity.HasIndex(a => a.Timestamp);
            entity.HasIndex(a => a.UserId);

            entity.HasOne(a => a.User)
                  .WithMany()
                  .HasForeignKey(a => a.UserId)
                  .OnDelete(DeleteBehavior.SetNull);
        });

        // HotspotSession
        modelBuilder.Entity<HotspotSession>(entity =>
        {
            entity.HasIndex(h => new { h.StudentId, h.IoTNodeId, h.StartTime });
            entity.HasIndex(h => h.DeviceMac);
            entity.HasIndex(h => h.AcctUniqueSessionId);

            entity.HasOne(h => h.Student)
                  .WithMany()
                  .HasForeignKey(h => h.StudentId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(h => h.IoTNode)
                  .WithMany()
                  .HasForeignKey(h => h.IoTNodeId)
                  .OnDelete(DeleteBehavior.Cascade);
        });
    }
}
