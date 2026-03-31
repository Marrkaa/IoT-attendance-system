using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("rooms")]
public class Room
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [MaxLength(200)]
    [Column("name")]
    public string Name { get; set; } = string.Empty;

    [Column("capacity")]
    public int Capacity { get; set; }

    [MaxLength(300)]
    [Column("location")]
    public string Location { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation properties
    public IoTNode? IoTNode { get; set; }
    public ICollection<Lecture> Lectures { get; set; } = new List<Lecture>();
}
