package pl.mkrew.backend.exception;

import lombok.Getter;

@Getter
public class AccountLockedException extends RuntimeException {
    private final Integer retryAfter;

    public AccountLockedException(String message, Integer retryAfter) {
        super(message);
        this.retryAfter = retryAfter;
    }
}
