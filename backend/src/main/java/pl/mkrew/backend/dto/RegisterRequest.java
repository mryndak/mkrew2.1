package pl.mkrew.backend.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RegisterRequest {

    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    @Size(max = 255, message = "Email must not exceed 255 characters")
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 8, message = "Password must be at least 8 characters long")
    @Pattern(
        regexp = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]+$",
        message = "Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character"
    )
    private String password;

    @NotBlank(message = "First name is required")
    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @NotBlank(message = "Last name is required")
    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Pattern(
        regexp = "^(0\\+|0-|A\\+|A-|B\\+|B-|AB\\+|AB-)$",
        message = "Blood group must be one of: 0+, 0-, A+, A-, B+, B-, AB+, AB-"
    )
    private String bloodGroup;

    private List<Long> favoriteRckikIds;

    @NotBlank(message = "Consent version is required")
    @Size(max = 20, message = "Consent version must not exceed 20 characters")
    private String consentVersion;

    @NotNull(message = "Consent acceptance is required")
    @AssertTrue(message = "You must accept the privacy policy")
    private Boolean consentAccepted;
}
