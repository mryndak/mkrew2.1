package pl.mkrew.backend.parser;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.select.Elements;
import org.springframework.stereotype.Component;
import pl.mkrew.backend.dto.BloodLevelData;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Parser for RCKiK Rzeszów blood levels
 * US-029: Implementacja parsera dla RCKiK Rzeszów
 */
@Component
@Slf4j
public class RzeszowParser implements Parser {

    private static final String PARSER_TYPE = "rzeszow";
    private static final String PARSER_VERSION = "rzeszow_v1";
    private static final Pattern PERCENTAGE_PATTERN = Pattern.compile("(\\d+(?:\\.\\d+)?)\\s*%?");

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public List<BloodLevelData> parseBloodLevels(String htmlContent) throws ParsingException {
        log.info("Parsing blood levels with Rzeszow parser");

        if (htmlContent == null || htmlContent.isBlank()) {
            throw new ParsingException("HTML content is empty");
        }

        List<BloodLevelData> bloodLevels = new ArrayList<>();

        try {
            Document doc = Jsoup.parse(htmlContent);

            // Default selectors for RCKiK Rzeszów
            // These can be overridden via ScraperConfig.cssSelectors
            String containerSelector = ".blood-levels-container, .blood-status, table.blood-table";
            String bloodGroupRowSelector = "tr.blood-row, tr[data-blood-group], tbody tr";
            String bloodGroupNameSelector = "td:nth-child(1), td.blood-group, .group-name";
            String levelPercentageSelector = "td:nth-child(2) .percentage, td.level, .level-value";

            Elements rows = doc.select(bloodGroupRowSelector);

            log.info("Found {} potential blood group rows", rows.size());

            for (Element row : rows) {
                try {
                    // Extract blood group
                    Element groupElement = row.selectFirst(bloodGroupNameSelector);
                    if (groupElement == null) {
                        // Try alternative: first td
                        groupElement = row.selectFirst("td:first-child");
                    }

                    if (groupElement == null) {
                        continue;
                    }

                    String bloodGroupText = groupElement.text().trim();
                    String bloodGroup = normalizeBloodGroup(bloodGroupText);

                    if (bloodGroup == null) {
                        log.debug("Skipping row with invalid blood group: {}", bloodGroupText);
                        continue;
                    }

                    // Extract level percentage
                    Element levelElement = row.selectFirst(levelPercentageSelector);
                    if (levelElement == null) {
                        // Try alternative: second td
                        levelElement = row.selectFirst("td:nth-child(2)");
                    }

                    if (levelElement == null) {
                        log.warn("No level element found for blood group: {}", bloodGroup);
                        continue;
                    }

                    String levelText = levelElement.text().trim();
                    BigDecimal levelPercentage = extractPercentage(levelText);

                    if (levelPercentage == null) {
                        log.warn("Could not parse percentage from text: {} for blood group: {}", levelText, bloodGroup);
                        continue;
                    }

                    BloodLevelData bloodLevel = BloodLevelData.builder()
                        .bloodGroup(bloodGroup)
                        .levelPercentage(levelPercentage)
                        .selector(bloodGroupRowSelector)
                        .rawText(bloodGroupText + " | " + levelText)
                        .build();

                    bloodLevels.add(bloodLevel);

                    log.debug("Parsed blood level: {} = {}%", bloodGroup, levelPercentage);

                } catch (Exception e) {
                    log.warn("Failed to parse blood level row: {}", row.text(), e);
                }
            }

            if (bloodLevels.isEmpty()) {
                throw new ParsingException("No valid blood levels found in HTML content");
            }

            log.info("Successfully parsed {} blood levels", bloodLevels.size());

        } catch (Exception e) {
            log.error("Error parsing blood levels", e);
            throw new ParsingException("Failed to parse blood levels: " + e.getMessage(), e);
        }

        return bloodLevels;
    }

    /**
     * Parse blood levels using custom CSS selectors from config
     */
    public List<BloodLevelData> parseBloodLevels(String htmlContent, JsonNode cssSelectors) throws ParsingException {
        log.info("Parsing blood levels with custom CSS selectors");

        if (htmlContent == null || htmlContent.isBlank()) {
            throw new ParsingException("HTML content is empty");
        }

        List<BloodLevelData> bloodLevels = new ArrayList<>();

        try {
            Document doc = Jsoup.parse(htmlContent);

            String containerSelector = cssSelectors.has("container")
                ? cssSelectors.get("container").asText()
                : null;

            String bloodGroupRowSelector = cssSelectors.get("bloodGroupRow").asText();
            String bloodGroupNameSelector = cssSelectors.get("bloodGroupName").asText();
            String levelPercentageSelector = cssSelectors.get("levelPercentage").asText();

            // Optional: Select container first
            Element container = containerSelector != null ? doc.selectFirst(containerSelector) : doc;

            if (container == null) {
                throw new ParsingException("Container not found with selector: " + containerSelector);
            }

            Elements rows = container.select(bloodGroupRowSelector);

            log.info("Found {} blood group rows with selector: {}", rows.size(), bloodGroupRowSelector);

            for (Element row : rows) {
                try {
                    Element groupElement = row.selectFirst(bloodGroupNameSelector);
                    if (groupElement == null) {
                        continue;
                    }

                    String bloodGroupText = groupElement.text().trim();
                    String bloodGroup = normalizeBloodGroup(bloodGroupText);

                    if (bloodGroup == null) {
                        continue;
                    }

                    Element levelElement = row.selectFirst(levelPercentageSelector);
                    if (levelElement == null) {
                        continue;
                    }

                    String levelText = levelElement.text().trim();
                    BigDecimal levelPercentage = extractPercentage(levelText);

                    if (levelPercentage == null) {
                        continue;
                    }

                    BloodLevelData bloodLevel = BloodLevelData.builder()
                        .bloodGroup(bloodGroup)
                        .levelPercentage(levelPercentage)
                        .selector(bloodGroupRowSelector)
                        .rawText(bloodGroupText + " | " + levelText)
                        .build();

                    bloodLevels.add(bloodLevel);

                } catch (Exception e) {
                    log.warn("Failed to parse blood level row: {}", row.text(), e);
                }
            }

            if (bloodLevels.isEmpty()) {
                throw new ParsingException("No valid blood levels found with provided selectors");
            }

            log.info("Successfully parsed {} blood levels", bloodLevels.size());

        } catch (Exception e) {
            log.error("Error parsing blood levels with custom selectors", e);
            throw new ParsingException("Failed to parse blood levels: " + e.getMessage(), e);
        }

        return bloodLevels;
    }

    /**
     * Normalize blood group text to standard format (e.g., "0+", "A-", "AB+")
     */
    private String normalizeBloodGroup(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        // Remove whitespace and normalize
        text = text.replaceAll("\\s+", "").toUpperCase();

        // Match patterns like: 0+, 0-, A+, A-, B+, B-, AB+, AB-
        if (text.matches("^(0|A|B|AB)[+-]$")) {
            return text;
        }

        // Try variations
        if (text.matches("^O[+-]$")) {
            return text.replace("O", "0");
        }

        return null;
    }

    /**
     * Extract percentage from text (e.g., "55%", "45.5%", "30 %")
     */
    private BigDecimal extractPercentage(String text) {
        if (text == null || text.isBlank()) {
            return null;
        }

        Matcher matcher = PERCENTAGE_PATTERN.matcher(text);
        if (matcher.find()) {
            try {
                String percentageStr = matcher.group(1);
                BigDecimal percentage = new BigDecimal(percentageStr);

                // Validate range 0-100
                if (percentage.compareTo(BigDecimal.ZERO) >= 0 && percentage.compareTo(new BigDecimal("100")) <= 0) {
                    return percentage;
                }
            } catch (NumberFormatException e) {
                log.debug("Failed to parse percentage: {}", text, e);
            }
        }

        return null;
    }

    @Override
    public String getParserType() {
        return PARSER_TYPE;
    }

    @Override
    public String getParserVersion() {
        return PARSER_VERSION;
    }
}
