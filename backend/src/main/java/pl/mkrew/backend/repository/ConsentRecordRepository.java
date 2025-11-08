package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.ConsentRecord;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConsentRecordRepository extends JpaRepository<ConsentRecord, Long> {

    /**
     * Find all consent records for a user
     * US-015: Consent tracking
     *
     * @param userId User ID
     * @return List of consent records
     */
    List<ConsentRecord> findByUserIdOrderByCreatedAtDesc(Long userId);

    /**
     * Find latest consent record for user and type
     *
     * @param userId User ID
     * @param consentType Consent type
     * @return Optional consent record
     */
    Optional<ConsentRecord> findFirstByUserIdAndConsentTypeOrderByCreatedAtDesc(Long userId, String consentType);

    /**
     * Check if user has accepted specific consent version
     *
     * @param userId User ID
     * @param consentVersion Consent version
     * @param consentType Consent type
     * @return true if accepted, false otherwise
     */
    boolean existsByUserIdAndConsentVersionAndConsentTypeAndAcceptedTrue(
            Long userId,
            String consentVersion,
            String consentType
    );
}
