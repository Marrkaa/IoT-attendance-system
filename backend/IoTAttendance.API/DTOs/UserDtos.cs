namespace IoTAttendance.API.DTOs;

public record UserDto(
    Guid Id,
    string Email,
    string FirstName,
    string LastName,
    string Role,
    string? AvatarUrl,
    bool IsActive,
    DateTime CreatedAt
);

public record CreateUserRequest(
    string Email,
    string Password,
    string FirstName,
    string LastName,
    string Role
);

public record UpdateUserRequest(
    string? FirstName,
    string? LastName,
    string? Email,
    string? Role,
    bool? IsActive
);
