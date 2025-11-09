package pl.mkrew.backend.repository;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserReport;

import java.util.Optional;

@Repository
public interface UserReportRepository extends JpaRepository<UserReport, Long> {

    /**
     * Find all reports (for admin)
     * US-021: Manage Reports
     *
     * @param pageable Pagination parameters
     * @return Page of user reports
     */
    Page<UserReport> findAll(Pageable pageable);

    /**
     * Find reports by status (for admin)
     *
     * @param status Report status
     * @param pageable Pagination parameters
     * @return Page of user reports
     */
    Page<UserReport> findByStatus(String status, Pageable pageable);

    /**
     * Find reports by RCKiK (for admin)
     *
     * @param rckikId RCKiK ID
     * @param pageable Pagination parameters
     * @return Page of user reports
     */
    Page<UserReport> findByRckikId(Long rckikId, Pageable pageable);

    /**
     * Find reports by status and RCKiK (for admin)
     *
     * @param status Report status
     * @param rckikId RCKiK ID
     * @param pageable Pagination parameters
     * @return Page of user reports
     */
    Page<UserReport> findByStatusAndRckikId(String status, Long rckikId, Pageable pageable);

    /**
     * Find reports by user (for user to view their own reports)
     *
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Page of user reports
     */
    Page<UserReport> findByUserId(Long userId, Pageable pageable);

    /**
     * Find report by ID
     *
     * @param id Report ID
     * @return Optional user report
     */
    Optional<UserReport> findById(Long id);

    /**
     * Check if user owns report
     *
     * @param id Report ID
     * @param userId User ID
     * @return true if owned by user, false otherwise
     */
    boolean existsByIdAndUserId(Long id, Long userId);

    /**
     * Count reports by status
     *
     * @param status Report status
     * @return Number of reports
     */
    long countByStatus(String status);
}
