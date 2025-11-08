package pl.mkrew.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.annotations.UpdateTimestamp;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "scraper_configs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScraperConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rckik_id", nullable = false, foreignKey = @ForeignKey(name = "fk_scraper_configs_rckik"))
    private Rckik rckik;

    @Column(name = "source_url", nullable = false, columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(name = "parser_type", nullable = false, length = 50)
    private String parserType;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "css_selectors", columnDefinition = "JSONB")
    private String cssSelectors;

    @Column(nullable = false)
    private Boolean active = true;

    @Column(name = "schedule_cron", length = 100)
    private String scheduleCron;

    @Column(name = "timeout_seconds", nullable = false)
    private Integer timeoutSeconds = 30;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;
}
