package pl.mkrew.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.util.List;

/**
 * DTO for parser test response (US-029, US-030)
 */
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ParserTestResponse {

    private String testId;
    private Long configId;
    private Long rckikId;
    private String rckikName;
    private String testUrl;
    private String parserType;
    private String status; // SUCCESS, PARTIAL, FAILED
    private Integer executionTimeMs;
    private Integer httpStatusCode;
    private List<ParsedDataEntry> parsedData;
    private List<String> warnings;
    private List<String> errors;
    private TestSummary summary;

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class ParsedDataEntry {
        private String bloodGroup;
        private BigDecimal levelPercentage;
        private String levelStatus;
        private SourceInfo source;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class SourceInfo {
        private String selector;
        private String rawText;
    }

    @Data
    @NoArgsConstructor
    @AllArgsConstructor
    @Builder
    public static class TestSummary {
        private Integer totalGroupsExpected;
        private Integer totalGroupsFound;
        private Integer successfulParses;
        private Integer failedParses;
        private Boolean saved;
    }
}
