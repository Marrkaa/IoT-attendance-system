using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("enrollments")]
public class Enrollment
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("student_id")]
    public Guid StudentId { get; set; }

    [Required]
    [Column("lecture_id")]
    public Guid LectureId { get; set; }

    [Column("enrolled_at")]
    public DateTime EnrolledAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("StudentId")]
    public User Student { get; set; } = null!;

    [ForeignKey("LectureId")]
    public Lecture Lecture { get; set; } = null!;
}
