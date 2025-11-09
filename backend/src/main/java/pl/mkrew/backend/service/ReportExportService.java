package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.BloodLevelStatisticsReportDto;
import pl.mkrew.backend.dto.DonationStatisticsReportDto;
import pl.mkrew.backend.dto.UserStatisticsReportDto;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.DonationRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * US-026: Service for generating anonymized aggregated reports
 * Provides data export capabilities without exposing PII
 */
@Service
@RequiredArgsConstructor
@Slf4j
@Transactional(readOnly = true)
public class ReportExportService {

    private final DonationRepository donationRepository;
    private final UserRepository userRepository;
    private final BloodSnapshotRepository bloodSnapshotRepository;

    /**
     * US-026: Generate anonymized donation statistics report
     * Aggregates donation data without exposing PII
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Donation statistics report
     */
    public DonationStatisticsReportDto generateDonationStatisticsReport(LocalDate fromDate, LocalDate toDate) {
        log.info("Generating donation statistics report from {} to {}", fromDate, toDate);

        // Validate date range
        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        // Get total donations
        Long totalDonations = donationRepository.countDonationsByDateRange(fromDate, toDate);

        // Get total volume
        Long totalVolumeMl = donationRepository.sumVolumeByDateRange(fromDate, toDate);

        // Calculate average volume
        Double averageVolumeMl = totalDonations > 0 ? (double) totalVolumeMl / totalDonations : 0.0;

        // Get donations by blood group
        Map<String, Long> donationsByBloodGroup = convertToMap(
                donationRepository.countDonationsByBloodGroup(fromDate, toDate)
        );

        // Get donations by type
        Map<String, Long> donationsByType = convertToMap(
                donationRepository.countDonationsByType(fromDate, toDate)
        );

        // Get donations by RCKiK
        Map<String, Long> donationsByRckik = convertToMap(
                donationRepository.countDonationsByRckik(fromDate, toDate)
        );

        // Get confirmed donations count
        Long confirmedDonations = donationRepository.countConfirmedDonations(fromDate, toDate);
        Long unconfirmedDonations = totalDonations - confirmedDonations;

        // Get unique donor count
        Long uniqueDonorCount = donationRepository.countUniqueDonors(fromDate, toDate);

        log.info("Generated donation statistics: total={}, unique donors={}", totalDonations, uniqueDonorCount);

        return DonationStatisticsReportDto.builder()
                .totalDonations(totalDonations)
                .totalVolumeMl(totalVolumeMl)
                .averageVolumeMl(Math.round(averageVolumeMl * 100.0) / 100.0) // Round to 2 decimal places
                .donationsByBloodGroup(donationsByBloodGroup)
                .donationsByType(donationsByType)
                .donationsByRckik(donationsByRckik)
                .confirmedDonations(confirmedDonations)
                .unconfirmedDonations(unconfirmedDonations)
                .fromDate(fromDate)
                .toDate(toDate)
                .uniqueDonorCount(uniqueDonorCount)
                .build();
    }

    /**
     * US-026: Generate anonymized user statistics report
     * Aggregates user data without exposing PII
     *
     * @return User statistics report
     */
    public UserStatisticsReportDto generateUserStatisticsReport() {
        log.info("Generating user statistics report");

        // Get total users
        Long totalUsers = userRepository.countActiveUsers();

        // Get verified users
        Long verifiedUsers = userRepository.countVerifiedUsers();
        Long unverifiedUsers = totalUsers - verifiedUsers;

        // Get users by blood group
        Map<String, Long> usersByBloodGroup = convertToMap(
                userRepository.countUsersByBloodGroup()
        );

        // Get active donors
        Long activeDonors = userRepository.countActiveDonors();
        Long inactiveDonors = totalUsers - activeDonors;

        // Get notification preferences
        Long usersWithEmailNotifications = userRepository.countUsersWithEmailNotifications();
        Long usersWithInAppNotifications = userRepository.countUsersWithInAppNotifications();

        // Get average favorites per user
        Double averageFavoritesPerUser = userRepository.calculateAverageFavoritesPerUser();
        if (averageFavoritesPerUser == null) {
            averageFavoritesPerUser = 0.0;
        }

        log.info("Generated user statistics: total={}, verified={}, active donors={}",
                totalUsers, verifiedUsers, activeDonors);

        return UserStatisticsReportDto.builder()
                .totalUsers(totalUsers)
                .verifiedUsers(verifiedUsers)
                .unverifiedUsers(unverifiedUsers)
                .usersByBloodGroup(usersByBloodGroup)
                .activeDonors(activeDonors)
                .inactiveDonors(inactiveDonors)
                .usersWithEmailNotifications(usersWithEmailNotifications)
                .usersWithInAppNotifications(usersWithInAppNotifications)
                .averageFavoritesPerUser(Math.round(averageFavoritesPerUser * 100.0) / 100.0)
                .build();
    }

    /**
     * US-026: Generate anonymized blood level statistics report
     * Aggregates blood inventory data without exposing sensitive operational details
     *
     * @param fromDate Start date (inclusive)
     * @param toDate End date (inclusive)
     * @return Blood level statistics report
     */
    public BloodLevelStatisticsReportDto generateBloodLevelStatisticsReport(LocalDate fromDate, LocalDate toDate) {
        log.info("Generating blood level statistics report from {} to {}", fromDate, toDate);

        // Validate date range
        if (fromDate.isAfter(toDate)) {
            throw new IllegalArgumentException("fromDate must be before or equal to toDate");
        }

        // Get average level by blood group
        Map<String, Double> averageLevelByBloodGroup = convertToDoubleMap(
                bloodSnapshotRepository.calculateAverageLevelByBloodGroup(fromDate, toDate)
        );

        // Get snapshots by status
        Map<String, Long> snapshotsByStatus = convertToMap(
                bloodSnapshotRepository.countSnapshotsByStatus(fromDate, toDate)
        );

        // Get snapshots by RCKiK
        Map<String, Long> snapshotsByRckik = convertToMap(
                bloodSnapshotRepository.countSnapshotsByRckik(fromDate, toDate)
        );

        // Get total snapshots
        Long totalSnapshots = bloodSnapshotRepository.countSnapshotsByDateRange(fromDate, toDate);

        // Get manual snapshots
        Long manualSnapshots = bloodSnapshotRepository.countManualSnapshots(fromDate, toDate);
        Long automatedSnapshots = totalSnapshots - manualSnapshots;

        // Get most critical blood group
        String mostCriticalBloodGroup = bloodSnapshotRepository.findMostCriticalBloodGroup(fromDate, toDate);

        // Calculate percentage of days with critical - simplified for now
        Long criticalCount = snapshotsByStatus.getOrDefault("CRITICAL", 0L);
        double percentageDaysWithCritical = totalSnapshots > 0
                ? (criticalCount.doubleValue() / totalSnapshots.doubleValue()) * 100.0
                : 0.0;

        log.info("Generated blood level statistics: total snapshots={}, critical={}, most critical group={}",
                totalSnapshots, criticalCount, mostCriticalBloodGroup);

        return BloodLevelStatisticsReportDto.builder()
                .averageLevelByBloodGroup(averageLevelByBloodGroup)
                .snapshotsByStatus(snapshotsByStatus)
                .snapshotsByRckik(snapshotsByRckik)
                .totalSnapshots(totalSnapshots)
                .manualSnapshots(manualSnapshots)
                .automatedSnapshots(automatedSnapshots)
                .fromDate(fromDate)
                .toDate(toDate)
                .percentageDaysWithCritical(Math.round(percentageDaysWithCritical * 100.0) / 100.0)
                .mostCriticalBloodGroup(mostCriticalBloodGroup)
                .build();
    }

    /**
     * Helper method to convert List of Object[] to Map<String, Long>
     * Expects Object[] format: [String key, Long value]
     */
    private Map<String, Long> convertToMap(List<Object[]> results) {
        Map<String, Long> map = new HashMap<>();
        for (Object[] row : results) {
            String key = (String) row[0];
            Long value = ((Number) row[1]).longValue();
            map.put(key, value);
        }
        return map;
    }

    /**
     * Helper method to convert List of Object[] to Map<String, Double>
     * Expects Object[] format: [String key, Double value]
     */
    private Map<String, Double> convertToDoubleMap(List<Object[]> results) {
        Map<String, Double> map = new HashMap<>();
        for (Object[] row : results) {
            String key = (String) row[0];
            Double value = ((Number) row[1]).doubleValue();
            map.put(key, Math.round(value * 100.0) / 100.0); // Round to 2 decimal places
        }
        return map;
    }
}
