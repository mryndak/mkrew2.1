package pl.mkrew.backend.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.util.StringUtils;
import org.springframework.web.client.RestTemplate;

/**
 * Service for verifying Google reCAPTCHA v2 tokens
 *
 * Verifies captcha tokens submitted by frontend against Google's reCAPTCHA API.
 * Used to protect login endpoint from brute force attacks after 3 failed attempts.
 *
 * Google reCAPTCHA v2 API Documentation:
 * https://developers.google.com/recaptcha/docs/verify
 */
@Service
@Slf4j
@RequiredArgsConstructor
public class ReCaptchaService {

    private static final String RECAPTCHA_VERIFY_URL = "https://www.google.com/recaptcha/api/siteverify";

    @Value("${recaptcha.secret.key:}")
    private String secretKey;

    private final RestTemplate restTemplate;

    /**
     * Verifies reCAPTCHA token against Google API
     *
     * @param token The reCAPTCHA token from frontend
     * @return true if token is valid, false otherwise
     */
    public boolean verify(String token) {
        // If secret key is not configured, skip verification (dev environment)
        if (!StringUtils.hasText(secretKey)) {
            log.warn("reCAPTCHA secret key not configured - skipping verification");
            return true;
        }

        // If token is empty, verification fails
        if (!StringUtils.hasText(token)) {
            log.warn("reCAPTCHA token is empty");
            return false;
        }

        try {
            // Prepare request to Google reCAPTCHA API
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            MultiValueMap<String, String> params = new LinkedMultiValueMap<>();
            params.add("secret", secretKey);
            params.add("response", token);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(params, headers);

            // Call Google reCAPTCHA verification API
            ReCaptchaResponse response = restTemplate.postForObject(
                RECAPTCHA_VERIFY_URL,
                request,
                ReCaptchaResponse.class
            );

            if (response == null) {
                log.error("reCAPTCHA verification failed - null response from Google API");
                return false;
            }

            if (!response.isSuccess()) {
                log.warn("reCAPTCHA verification failed - error codes: {}", response.getErrorCodes());
                return false;
            }

            log.debug("reCAPTCHA verification successful");
            return true;

        } catch (Exception e) {
            log.error("reCAPTCHA verification failed with exception", e);
            // In case of API errors, fail open to prevent legitimate users from being blocked
            // This is a security trade-off - adjust based on your requirements
            return true;
        }
    }

    /**
     * Response from Google reCAPTCHA verification API
     */
    @Data
    private static class ReCaptchaResponse {

        @JsonProperty("success")
        private boolean success;

        @JsonProperty("challenge_ts")
        private String challengeTimestamp;

        @JsonProperty("hostname")
        private String hostname;

        @JsonProperty("error-codes")
        private String[] errorCodes;
    }
}
