package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserToken;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserTokenRepository extends JpaRepository<UserToken, Long> {

    Optional<UserToken> findByTokenAndTokenType(String token, String tokenType);

    Optional<UserToken> findByTokenAndTokenTypeAndUsedAtIsNullAndExpiresAtAfter(
        String token,
        String tokenType,
        LocalDateTime now
    );

    List<UserToken> findByUserIdAndTokenType(Long userId, String tokenType);

    void deleteByExpiresAtBefore(LocalDateTime now);
}
