using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("schedules")]
public class Schedule
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("lecture_id")]
    public Guid LectureId { get; set; }

    [Column("day_of_week")]
    public int DayOfWeek { get; set; } // 0=Monday ... 6=Sunday

    [Required]
    [Column("start_time")]
    public TimeOnly StartTime { get; set; }

    [Required]
    [Column("end_time")]
    public TimeOnly EndTime { get; set; }

    [Column("valid_from")]
    public DateOnly? ValidFrom { get; set; }

    [Column("valid_until")]
    public DateOnly? ValidUntil { get; set; }

    // Navigation
    [ForeignKey("LectureId")]
    public Lecture Lecture { get; set; } = null!;
}
