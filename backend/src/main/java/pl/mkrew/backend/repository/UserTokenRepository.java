package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserToken;

import java.time.LocalDateTime;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {

    Optional<UserToken> findByTokenAndTokenType(String token, String tokenType);

    Optional<UserToken> findByTokenAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
        String token,
        String tokenType,
        LocalDateTime now
    );

    void deleteByExpiresAtBefore(LocalDateTime now);
}
