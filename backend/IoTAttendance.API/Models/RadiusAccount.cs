using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace IoTAttendance.API.Models;

[Table("radius_accounts")]
public class RadiusAccount
{
    [Key]
    [Column("id")]
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required]
    [Column("user_id")]
    public Guid UserId { get; set; }

    [Required]
    [MaxLength(100)]
    [Column("radius_username")]
    public string RadiusUsername { get; set; } = string.Empty;

    [Required]
    [MaxLength(255)]
    [Column("radius_password_hash")]
    public string RadiusPasswordHash { get; set; } = string.Empty;

    [Column("is_enabled")]
    public bool IsEnabled { get; set; } = true;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    [ForeignKey("UserId")]
    public User User { get; set; } = null!;
}
