package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserSession;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {

    /**
     * Revoke all active sessions for a user
     * Used when user deletes account or resets password
     *
     * @param userId User ID
     * @return Number of sessions revoked
     */
    @Modifying
    @Query("UPDATE UserSession s SET s.revoked = true WHERE s.user.id = :userId AND s.revoked = false")
    int revokeAllSessionsByUserId(Long userId);
}
