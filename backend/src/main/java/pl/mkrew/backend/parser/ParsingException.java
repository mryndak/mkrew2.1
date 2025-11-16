package pl.mkrew.backend.parser;

/**
 * Exception thrown when parsing fails
 */
public class ParsingException extends Exception {

    public ParsingException(String message) {
        super(message);
    }

    public ParsingException(String message, Throwable cause) {
        super(message, cause);
    }
}
