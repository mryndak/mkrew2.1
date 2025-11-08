package pl.mkrew.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "user_reports")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserReport {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_reports_user"))
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "blood_snapshot_id", foreignKey = @ForeignKey(name = "fk_user_reports_blood_snapshot"))
    private BloodSnapshot bloodSnapshot;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rckik_id", nullable = false, foreignKey = @ForeignKey(name = "fk_user_reports_rckik"))
    private Rckik rckik;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Column(name = "screenshot_url", columnDefinition = "TEXT")
    private String screenshotUrl;

    @Column(nullable = false, length = 50)
    private String status = "NEW";

    @Column(name = "admin_notes", columnDefinition = "TEXT")
    private String adminNotes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "resolved_by", foreignKey = @ForeignKey(name = "fk_user_reports_resolved_by"))
    private User resolvedBy;

    @Column(name = "resolved_at")
    private LocalDateTime resolvedAt;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
