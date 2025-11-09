package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.CreateUserReportRequest;
import pl.mkrew.backend.dto.UpdateUserReportRequest;
import pl.mkrew.backend.dto.UserReportDto;
import pl.mkrew.backend.entity.BloodSnapshot;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.entity.UserReport;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserReportRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserReportService {

    private final UserReportRepository userReportRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;
    private final BloodSnapshotRepository bloodSnapshotRepository;

    /**
     * Create new user report
     * US-021: Report Data Issue
     *
     * @param userId User ID (from JWT)
     * @param request Report data
     * @return Created report
     */
    @Transactional
    public UserReportDto createReport(Long userId, CreateUserReportRequest request) {
        log.debug("Creating user report for user ID: {} for RCKiK ID: {}", userId, request.getRckikId());

        // Verify user exists and is active
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify RCKiK exists
        Rckik rckik = rckikRepository.findById(request.getRckikId())
                .orElseThrow(() -> new ResourceNotFoundException("RCKiK not found with ID: " + request.getRckikId()));

        // Verify blood snapshot exists (if provided)
        BloodSnapshot bloodSnapshot = null;
        if (request.getBloodSnapshotId() != null) {
            bloodSnapshot = bloodSnapshotRepository.findById(request.getBloodSnapshotId())
                    .orElseThrow(() -> new ResourceNotFoundException("Blood snapshot not found with ID: " + request.getBloodSnapshotId()));
        }

        // Create report
        UserReport report = UserReport.builder()
                .user(user)
                .rckik(rckik)
                .bloodSnapshot(bloodSnapshot)
                .description(request.getDescription())
                .screenshotUrl(request.getScreenshotUrl())
                .status("NEW")
                .build();

        UserReport savedReport = userReportRepository.save(report);

        log.info("Created user report ID: {} for user ID: {} regarding RCKiK ID: {}",
                savedReport.getId(), userId, request.getRckikId());

        // TODO: Send notification to admins about new report

        return mapToDto(savedReport);
    }

    /**
     * List all reports for admin with optional filters
     * US-021: Manage Reports
     *
     * @param status Optional status filter
     * @param rckikId Optional RCKiK filter
     * @param pageable Pagination parameters
     * @return Paginated report list
     */
    @Transactional(readOnly = true)
    public Page<UserReportDto> listReportsForAdmin(String status, Long rckikId, Pageable pageable) {
        log.debug("Listing user reports for admin with filters - status: {}, rckikId: {}", status, rckikId);

        Page<UserReport> reportPage;

        // Apply filters
        if (status != null && rckikId != null) {
            reportPage = userReportRepository.findByStatusAndRckikId(status, rckikId, pageable);
        } else if (status != null) {
            reportPage = userReportRepository.findByStatus(status, pageable);
        } else if (rckikId != null) {
            reportPage = userReportRepository.findByRckikId(rckikId, pageable);
        } else {
            reportPage = userReportRepository.findAll(pageable);
        }

        log.info("Retrieved {} user reports (page {}/{})",
                reportPage.getNumberOfElements(), reportPage.getNumber() + 1, reportPage.getTotalPages());

        return reportPage.map(this::mapToDto);
    }

    /**
     * Get report details by ID (admin only)
     *
     * @param reportId Report ID
     * @return Report details
     */
    @Transactional(readOnly = true)
    public UserReportDto getReportDetails(Long reportId) {
        log.debug("Getting report details for report ID: {}", reportId);

        UserReport report = userReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("User report not found with ID: " + reportId));

        return mapToDto(report);
    }

    /**
     * Update report status (admin only)
     * US-021: Manage Reports
     *
     * @param reportId Report ID
     * @param request Update data
     * @param adminUserId Admin user ID (from JWT)
     * @return Updated report
     */
    @Transactional
    public UserReportDto updateReportStatus(Long reportId, UpdateUserReportRequest request, Long adminUserId) {
        log.debug("Updating report ID: {} status to: {} by admin ID: {}",
                reportId, request.getStatus(), adminUserId);

        // Find report
        UserReport report = userReportRepository.findById(reportId)
                .orElseThrow(() -> new ResourceNotFoundException("User report not found with ID: " + reportId));

        // Get admin user
        User adminUser = userRepository.findByIdAndDeletedAtIsNull(adminUserId)
                .orElseThrow(() -> new ResourceNotFoundException("Admin user not found with ID: " + adminUserId));

        // Update status if provided
        if (request.getStatus() != null) {
            report.setStatus(request.getStatus());

            // Set resolved fields if status is RESOLVED or REJECTED
            if ("RESOLVED".equals(request.getStatus()) || "REJECTED".equals(request.getStatus())) {
                report.setResolvedBy(adminUser);
                report.setResolvedAt(LocalDateTime.now());
            }
        }

        // Update admin notes if provided
        if (request.getAdminNotes() != null) {
            report.setAdminNotes(request.getAdminNotes());
        }

        UserReport updatedReport = userReportRepository.save(report);

        log.info("Updated report ID: {} to status: {} by admin ID: {}",
                reportId, report.getStatus(), adminUserId);

        // TODO: Create audit log entry

        return mapToDto(updatedReport);
    }

    /**
     * List reports for specific user (user can view their own reports)
     *
     * @param userId User ID
     * @param pageable Pagination parameters
     * @return Paginated report list
     */
    @Transactional(readOnly = true)
    public Page<UserReportDto> listUserReports(Long userId, Pageable pageable) {
        log.debug("Listing reports for user ID: {}", userId);

        // Verify user exists and is active
        if (!userRepository.existsByIdAndDeletedAtIsNull(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        Page<UserReport> reportPage = userReportRepository.findByUserId(userId, pageable);

        log.info("Retrieved {} reports for user ID: {} (page {}/{})",
                reportPage.getNumberOfElements(), userId, reportPage.getNumber() + 1, reportPage.getTotalPages());

        return reportPage.map(this::mapToDto);
    }

    /**
     * Map UserReport entity to DTO
     *
     * @param report User report entity
     * @return User report DTO
     */
    private UserReportDto mapToDto(UserReport report) {
        UserReportDto.UserSummaryDto userDto = UserReportDto.UserSummaryDto.builder()
                .id(report.getUser().getId())
                .email(report.getUser().getEmail())
                .firstName(report.getUser().getFirstName())
                .lastName(report.getUser().getLastName())
                .build();

        UserReportDto.UserSummaryDto resolvedByDto = null;
        if (report.getResolvedBy() != null) {
            resolvedByDto = UserReportDto.UserSummaryDto.builder()
                    .id(report.getResolvedBy().getId())
                    .email(report.getResolvedBy().getEmail())
                    .firstName(report.getResolvedBy().getFirstName())
                    .lastName(report.getResolvedBy().getLastName())
                    .build();
        }

        return UserReportDto.builder()
                .id(report.getId())
                .user(userDto)
                .rckikId(report.getRckik().getId())
                .rckikName(report.getRckik().getName())
                .bloodSnapshotId(report.getBloodSnapshot() != null ? report.getBloodSnapshot().getId() : null)
                .description(report.getDescription())
                .screenshotUrl(report.getScreenshotUrl())
                .status(report.getStatus())
                .adminNotes(report.getAdminNotes())
                .resolvedBy(resolvedByDto)
                .resolvedAt(report.getResolvedAt())
                .createdAt(report.getCreatedAt())
                .updatedAt(report.getUpdatedAt())
                .build();
    }
}
