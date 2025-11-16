package pl.mkrew.backend.parser;

import pl.mkrew.backend.dto.BloodLevelData;

import java.util.List;

/**
 * Interface for all blood level parsers
 * US-029, US-030: Parser infrastructure
 */
public interface Parser {

    /**
     * Parse blood levels from HTML content
     *
     * @param htmlContent HTML content to parse
     * @return List of blood level data
     * @throws ParsingException if parsing fails
     */
    List<BloodLevelData> parseBloodLevels(String htmlContent) throws ParsingException;

    /**
     * Get parser type identifier
     *
     * @return Parser type (e.g., "rzeszow", "warszawa", "custom")
     */
    String getParserType();

    /**
     * Get parser version
     *
     * @return Parser version (e.g., "1.0.0", "rzeszow_v1")
     */
    String getParserVersion();
}
