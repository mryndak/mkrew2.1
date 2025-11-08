package pl.mkrew.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "scraper_runs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScraperRun {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "run_type", nullable = false, length = 50)
    private String runType;

    @CreationTimestamp
    @Column(name = "started_at", nullable = false, updatable = false)
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @Column(name = "total_rckiks")
    private Integer totalRckiks;

    @Column(name = "successful_count", nullable = false)
    private Integer successfulCount = 0;

    @Column(name = "failed_count", nullable = false)
    private Integer failedCount = 0;

    @Column(name = "duration_seconds")
    private Integer durationSeconds;

    @Column(name = "triggered_by", nullable = false, length = 100)
    private String triggeredBy;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "error_summary", columnDefinition = "TEXT")
    private String errorSummary;
}
