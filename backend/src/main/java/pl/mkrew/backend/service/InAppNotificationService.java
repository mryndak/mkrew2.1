package pl.mkrew.backend.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import pl.mkrew.backend.dto.InAppNotificationDto;
import pl.mkrew.backend.dto.InAppNotificationsResponse;
import pl.mkrew.backend.dto.UnreadCountResponse;
import pl.mkrew.backend.entity.InAppNotification;
import pl.mkrew.backend.entity.Rckik;
import pl.mkrew.backend.entity.User;
import pl.mkrew.backend.exception.ResourceNotFoundException;
import pl.mkrew.backend.repository.InAppNotificationRepository;
import pl.mkrew.backend.repository.RckikRepository;
import pl.mkrew.backend.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * Service for managing in-app notifications
 * US-011: In-App Notifications
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class InAppNotificationService {

    private final InAppNotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final RckikRepository rckikRepository;

    /**
     * Get notifications for a user
     *
     * @param userId     User ID
     * @param unreadOnly Filter only unread
     * @param page       Page number
     * @param size       Page size
     * @return Notifications response
     */
    @Transactional(readOnly = true)
    public InAppNotificationsResponse getUserNotifications(Long userId, boolean unreadOnly,
                                                            int page, int size) {
        log.debug("Getting notifications for user {} (unreadOnly: {})", userId, unreadOnly);

        Pageable pageable = PageRequest.of(page, size);
        Page<InAppNotification> notificationPage;

        if (unreadOnly) {
            notificationPage = notificationRepository.findUnreadByUserId(userId, pageable);
        } else {
            notificationPage = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        }

        List<InAppNotificationDto> notifications = notificationPage.getContent().stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        long unreadCount = notificationRepository.countUnreadByUserId(userId);

        return InAppNotificationsResponse.builder()
                .notifications(notifications)
                .page(page)
                .size(size)
                .totalElements(notificationPage.getTotalElements())
                .unreadCount(unreadCount)
                .build();
    }

    /**
     * Mark notification as read
     *
     * @param notificationId Notification ID
     * @param userId         User ID (for ownership validation)
     * @param readAt         Read timestamp
     * @return Updated notification DTO
     */
    @Transactional
    public InAppNotificationDto markAsRead(Long notificationId, Long userId, LocalDateTime readAt) {
        log.debug("Marking notification {} as read for user {}", notificationId, userId);

        InAppNotification notification = notificationRepository.findByIdAndUserId(notificationId, userId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Notification not found with id: " + notificationId));

        // Idempotent: If already read, return as is
        if (notification.getReadAt() != null) {
            log.debug("Notification {} already marked as read", notificationId);
            return toDto(notification);
        }

        notification.setReadAt(readAt);
        InAppNotification saved = notificationRepository.save(notification);

        log.info("Notification {} marked as read for user {}", notificationId, userId);

        return toDto(saved);
    }

    /**
     * Get unread notification count for a user
     *
     * @param userId User ID
     * @return Unread count response
     */
    @Transactional(readOnly = true)
    public UnreadCountResponse getUnreadCount(Long userId) {
        log.debug("Getting unread count for user {}", userId);

        long count = notificationRepository.countUnreadByUserId(userId);

        return UnreadCountResponse.builder()
                .unreadCount(count)
                .build();
    }

    /**
     * Create a new in-app notification
     *
     * @param userId           User ID
     * @param notificationType Notification type
     * @param rckikId          RCKiK ID (optional)
     * @param title            Notification title
     * @param message          Notification message
     * @param linkUrl          Link URL (optional)
     * @param expiresAt        Expiration timestamp (optional)
     * @return Created notification
     */
    @Transactional
    public InAppNotification createNotification(Long userId, String notificationType,
                                                 Long rckikId, String title, String message,
                                                 String linkUrl, LocalDateTime expiresAt) {
        log.debug("Creating notification for user {}: type={}, rckikId={}", userId, notificationType, rckikId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found with id: " + userId));

        Rckik rckik = null;
        if (rckikId != null) {
            rckik = rckikRepository.findById(rckikId)
                    .orElseThrow(() -> new ResourceNotFoundException("RCKiK not found with id: " + rckikId));
        }

        InAppNotification notification = InAppNotification.builder()
                .user(user)
                .notificationType(notificationType)
                .rckik(rckik)
                .title(title)
                .message(message)
                .linkUrl(linkUrl)
                .expiresAt(expiresAt)
                .build();

        InAppNotification saved = notificationRepository.save(notification);

        log.info("Created notification {} for user {}", saved.getId(), userId);

        return saved;
    }

    /**
     * Convert entity to DTO
     *
     * @param notification InAppNotification entity
     * @return InAppNotificationDto
     */
    private InAppNotificationDto toDto(InAppNotification notification) {
        InAppNotificationDto.RckikDto rckikDto = null;
        if (notification.getRckik() != null) {
            rckikDto = InAppNotificationDto.RckikDto.builder()
                    .id(notification.getRckik().getId())
                    .name(notification.getRckik().getName())
                    .build();
        }

        return InAppNotificationDto.builder()
                .id(notification.getId())
                .type(notification.getNotificationType())
                .rckik(rckikDto)
                .title(notification.getTitle())
                .message(notification.getMessage())
                .linkUrl(notification.getLinkUrl())
                .readAt(notification.getReadAt())
                .expiresAt(notification.getExpiresAt())
                .createdAt(notification.getCreatedAt())
                .build();
    }
}
