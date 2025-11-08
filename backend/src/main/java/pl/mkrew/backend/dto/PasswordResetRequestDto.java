package pl.mkrew.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PasswordResetRequestDto {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String email;
}
