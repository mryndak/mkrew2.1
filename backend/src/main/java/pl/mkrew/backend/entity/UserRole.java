package pl.mkrew.backend.entity;

/**
 * User roles for Role-Based Access Control (RBAC)
 *
 * USER - Regular blood donor (default role)
 * ADMIN - System administrator with full access to admin panel
 */
public enum UserRole {
    /**
     * Regular user (blood donor)
     * - Can manage their own profile
     * - Can add donations to diary
     * - Can set notification preferences
     * - Can favorite RCKiK centers
     * - Can view public data (blood levels, RCKiK list)
     */
    USER,

    /**
     * Administrator
     * - All USER permissions
     * - Can manage RCKiK centers (CRUD)
     * - Can monitor scraper runs
     * - Can view audit logs
     * - Can manage user reports
     * - Can access admin panel
     */
    ADMIN
}
