package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.BloodLevelDto;
import pl.mkrew.backend.dto.FavoriteRckikDto;
import pl.mkrew.backend.entity.BloodSnapshot;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.entity.UserFavoriteRckik;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.BloodSnapshotRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserFavoriteRckikRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class FavoriteRckikService {

    private final UserFavoriteRckikRepository favoriteRckikRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;
    private final BloodSnapshotRepository bloodSnapshotRepository;

    /**
     * Get user's favorite RCKiK centers with current blood levels
     * US-009: List Favorites
     *
     * @param userId User ID
     * @return List of favorite centers
     */
    @Transactional(readOnly = true)
    public List<FavoriteRckikDto> getUserFavorites(Long userId) {
        log.debug("Getting favorites for user ID: {}", userId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Get favorites ordered by priority
        List<UserFavoriteRckik> favorites = favoriteRckikRepository
                .findByUserIdOrderByPriorityAscCreatedAtDesc(userId);

        if (favorites.isEmpty()) {
            log.info("No favorites found for user ID: {}", userId);
            return List.of();
        }

        // Get RCKiK IDs
        List<Long> rckikIds = favorites.stream()
                .map(f -> f.getRckik().getId())
                .collect(Collectors.toList());

        // Fetch latest blood snapshots for all favorite centers
        List<BloodSnapshot> snapshots = bloodSnapshotRepository.findLatestByRckikIds(rckikIds);
        Map<Long, List<BloodSnapshot>> snapshotsByRckikId = snapshots.stream()
                .collect(Collectors.groupingBy(bs -> bs.getRckik().getId()));

        // Map to DTOs
        List<FavoriteRckikDto> result = favorites.stream()
                .map(favorite -> {
                    Rckik rckik = favorite.getRckik();
                    List<BloodSnapshot> rckikSnapshots = snapshotsByRckikId.getOrDefault(rckik.getId(), List.of());
                    return mapToFavoriteDto(favorite, rckik, rckikSnapshots);
                })
                .collect(Collectors.toList());

        log.info("Retrieved {} favorites for user ID: {}", result.size(), userId);
        return result;
    }

    /**
     * Add RCKiK center to user's favorites
     * US-009: Add Favorite
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @param priority Optional priority
     * @return Created favorite entry
     */
    @Transactional
    public FavoriteRckikDto addFavorite(Long userId, Long rckikId, Integer priority) {
        log.debug("Adding favorite for user ID: {} - RCKiK ID: {}, priority: {}", userId, rckikId, priority);

        // Verify user exists
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with ID: " + userId));

        // Verify RCKiK exists
        Rckik rckik = rckikRepository.findById(rckikId)
                .orElseThrow(() -> new ResourceNotFoundException("RCKiK center not found with ID: " + rckikId));

        // Check if already favorited
        if (favoriteRckikRepository.existsByUserIdAndRckikId(userId, rckikId)) {
            log.warn("RCKiK {} is already favorited by user {}", rckikId, userId);
            throw new IllegalStateException("RCKiK center is already in favorites");
        }

        // Create favorite entry
        UserFavoriteRckik favorite = UserFavoriteRckik.builder()
                .user(user)
                .rckik(rckik)
                .priority(priority)
                .build();

        UserFavoriteRckik savedFavorite = favoriteRckikRepository.save(favorite);

        // Get current blood levels
        List<BloodSnapshot> snapshots = bloodSnapshotRepository.findLatestByRckikId(rckikId);

        log.info("Added RCKiK {} to favorites for user {}", rckikId, userId);

        return mapToFavoriteDto(savedFavorite, rckik, snapshots);
    }

    /**
     * Remove RCKiK center from user's favorites
     * US-009: Remove Favorite
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     */
    @Transactional
    public void removeFavorite(Long userId, Long rckikId) {
        log.debug("Removing favorite for user ID: {} - RCKiK ID: {}", userId, rckikId);

        // Verify user exists
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException("User not found with ID: " + userId);
        }

        // Check if favorite exists
        if (!favoriteRckikRepository.existsByUserIdAndRckikId(userId, rckikId)) {
            log.warn("Favorite not found for user {} and RCKiK {}", userId, rckikId);
            throw new ResourceNotFoundException("Favorite not found");
        }

        // Delete favorite
        favoriteRckikRepository.deleteByUserIdAndRckikId(userId, rckikId);

        log.info("Removed RCKiK {} from favorites for user {}", rckikId, userId);
    }

    /**
     * Check if RCKiK center is favorited by user
     *
     * @param userId User ID
     * @param rckikId RCKiK ID
     * @return true if favorited, false otherwise
     */
    @Transactional(readOnly = true)
    public boolean isFavorite(Long userId, Long rckikId) {
        return favoriteRckikRepository.existsByUserIdAndRckikId(userId, rckikId);
    }

    /**
     * Map UserFavoriteRckik to FavoriteRckikDto with blood levels
     *
     * @param favorite Favorite entry
     * @param rckik RCKiK entity
     * @param snapshots Blood snapshots
     * @return FavoriteRckikDto
     */
    private FavoriteRckikDto mapToFavoriteDto(
            UserFavoriteRckik favorite,
            Rckik rckik,
            List<BloodSnapshot> snapshots) {

        List<BloodLevelDto> bloodLevels = snapshots.stream()
                .map(this::mapToBloodLevelDto)
                .collect(Collectors.toList());

        return FavoriteRckikDto.builder()
                .id(favorite.getId())
                .rckikId(rckik.getId())
                .name(rckik.getName())
                .code(rckik.getCode())
                .city(rckik.getCity())
                .address(rckik.getAddress())
                .latitude(rckik.getLatitude())
                .longitude(rckik.getLongitude())
                .active(rckik.getActive())
                .priority(favorite.getPriority())
                .addedAt(favorite.getCreatedAt())
                .currentBloodLevels(bloodLevels)
                .build();
    }

    /**
     * Map BloodSnapshot to BloodLevelDto
     *
     * @param snapshot BloodSnapshot entity
     * @return BloodLevelDto
     */
    private BloodLevelDto mapToBloodLevelDto(BloodSnapshot snapshot) {
        String levelStatus = calculateLevelStatus(snapshot.getLevelPercentage());

        return BloodLevelDto.builder()
                .bloodGroup(snapshot.getBloodGroup())
                .levelPercentage(snapshot.getLevelPercentage())
                .levelStatus(levelStatus)
                .lastUpdate(snapshot.getScrapedAt())
                .build();
    }

    /**
     * Calculate blood level status based on percentage
     *
     * @param levelPercentage Blood level percentage
     * @return Status string (CRITICAL, IMPORTANT, OK)
     */
    private String calculateLevelStatus(BigDecimal levelPercentage) {
        if (levelPercentage == null) {
            return "UNKNOWN";
        }

        if (levelPercentage.compareTo(new BigDecimal("20")) < 0) {
            return "CRITICAL";
        } else if (levelPercentage.compareTo(new BigDecimal("50")) < 0) {
            return "IMPORTANT";
        } else {
            return "OK";
        }
    }
}
