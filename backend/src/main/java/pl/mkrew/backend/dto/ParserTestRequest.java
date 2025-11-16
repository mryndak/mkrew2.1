package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * DTO for testing parser configuration (US-029, US-030)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParserTestRequest {

    private String testUrl; // Optional, overrides config's sourceUrl for testing
}
