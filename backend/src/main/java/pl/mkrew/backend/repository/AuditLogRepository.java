package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.AuditLog;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    /**
     * Find audit logs by actor ID
     * US-024: Audit Trail
     *
     * @param actorId Actor ID (user ID or "SYSTEM")
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByActorIdOrderByCreatedAtDesc(String actorId, Pageable pageable);

    /**
     * Find audit logs by action type
     *
     * @param action Action type
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByActionOrderByCreatedAtDesc(String action, Pageable pageable);

    /**
     * Find audit logs by target type and ID
     *
     * @param targetType Target type (e.g., "donation", "user")
     * @param targetId Target ID
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(
            String targetType,
            Long targetId,
            Pageable pageable
    );

    /**
     * Find audit logs by actor and date range
     *
     * @param actorId Actor ID
     * @param fromDate Start date
     * @param toDate End date
     * @param pageable Pagination parameters
     * @return Page of audit logs
     */
    Page<AuditLog> findByActorIdAndCreatedAtBetweenOrderByCreatedAtDesc(
            String actorId,
            LocalDateTime fromDate,
            LocalDateTime toDate,
            Pageable pageable
    );

    /**
     * Find all audit logs for specific target
     *
     * @param targetType Target type
     * @param targetId Target ID
     * @return List of audit logs
     */
    List<AuditLog> findByTargetTypeAndTargetIdOrderByCreatedAtDesc(String targetType, Long targetId);

    /**
     * Find audit logs with optional filters
     * US-024: Audit Trail with comprehensive filtering
     *
     * @param actorId Actor ID (optional)
     * @param action Action type (optional)
     * @param targetType Target type (optional)
     * @param targetId Target ID (optional)
     * @param fromDate Start date (optional)
     * @param toDate End date (optional)
     * @param pageable Pagination parameters
     * @return Page of audit logs matching the filters
     */
    @Query("""
            SELECT al FROM AuditLog al
            WHERE (:actorId IS NULL OR al.actorId = :actorId)
            AND (:action IS NULL OR al.action = :action)
            AND (:targetType IS NULL OR al.targetType = :targetType)
            AND (:targetId IS NULL OR al.targetId = :targetId)
            AND (:fromDate IS NULL OR al.createdAt >= :fromDate)
            AND (:toDate IS NULL OR al.createdAt <= :toDate)
            ORDER BY al.createdAt DESC
            """)
    Page<AuditLog> findWithFilters(
            @Param("actorId") String actorId,
            @Param("action") String action,
            @Param("targetType") String targetType,
            @Param("targetId") Long targetId,
            @Param("fromDate") LocalDateTime fromDate,
            @Param("toDate") LocalDateTime toDate,
            Pageable pageable
    );
}
