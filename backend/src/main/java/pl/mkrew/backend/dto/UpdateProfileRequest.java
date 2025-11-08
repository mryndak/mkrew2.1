package pl.mkrew.backend.dto;

import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UpdateProfileRequest {

    @Size(max = 100, message = "First name must not exceed 100 characters")
    private String firstName;

    @Size(max = 100, message = "Last name must not exceed 100 characters")
    private String lastName;

    @Pattern(
            regexp = "^(0\\+|0-|A\\+|A-|B\\+|B-|AB\\+|AB-)?$",
            message = "Blood group must be one of: 0+, 0-, A+, A-, B+, B-, AB+, AB-, or empty"
    )
    private String bloodGroup;
}
