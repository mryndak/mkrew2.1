package pl.mkrew.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_snapshots")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BloodSnapshot {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rckik_id", nullable = false, foreignKey = @ForeignKey(name = "fk_blood_snapshots_rckik"))
    private Rckik rckik;

    @Column(name = "snapshot_date", nullable = false)
    private LocalDate snapshotDate;

    @Column(name = "blood_group", nullable = false, length = 5)
    private String bloodGroup;

    @Column(name = "level_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal levelPercentage;

    @Column(name = "source_url", columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "parser_version", length = 50)
    private String parserVersion;

    @CreationTimestamp
    @Column(name = "scraped_at", nullable = false, updatable = false)
    private LocalDateTime scrapedAt;

    @Column(name = "is_manual", nullable = false)
    private Boolean isManual = false;
}
