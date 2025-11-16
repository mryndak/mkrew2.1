package pl.mkrew.backend.parser;

import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

/**
 * Factory for creating parser instances
 * US-029, US-030: Parser infrastructure
 */
@Component
@Slf4j
public class ParserFactory {

    private final Map<String, Parser> parsers = new HashMap<>();

    /**
     * Register a parser
     *
     * @param parserType Parser type identifier
     * @param parser Parser instance
     */
    public void registerParser(String parserType, Parser parser) {
        parsers.put(parserType.toLowerCase(), parser);
        log.info("Registered parser: {} - version: {}", parserType, parser.getParserVersion());
    }

    /**
     * Get parser by type
     *
     * @param parserType Parser type identifier
     * @return Parser instance
     * @throws IllegalArgumentException if parser not found
     */
    public Parser getParser(String parserType) {
        Parser parser = parsers.get(parserType.toLowerCase());
        if (parser == null) {
            throw new IllegalArgumentException("Parser not found for type: " + parserType);
        }
        return parser;
    }

    /**
     * Check if parser exists for type
     *
     * @param parserType Parser type identifier
     * @return true if parser exists
     */
    public boolean hasParser(String parserType) {
        return parsers.containsKey(parserType.toLowerCase());
    }
}
