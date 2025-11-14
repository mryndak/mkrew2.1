package pl.mkrew.backend.util;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

/**
 * Utility class to generate BCrypt password hashes
 * Used for creating initial admin user password
 *
 * Usage: Run main method to generate hash for a password
 */
public class PasswordHashGenerator {

    public static void main(String[] args) {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder(12);

        // Generate hash for initial admin password: "Admin123!"
        String password = "Admin123!";
        String hash = encoder.encode(password);

        System.out.println("Password: " + password);
        System.out.println("BCrypt Hash (cost 12): " + hash);
        System.out.println();
        System.out.println("IMPORTANT: Change this password immediately after first login!");
    }
}
