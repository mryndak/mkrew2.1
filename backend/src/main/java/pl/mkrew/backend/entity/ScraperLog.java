package pl.mkrew.backend.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.LocalDateTime;

@Entity
@Table(name = "scraper_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ScraperLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "scraper_run_id", foreignKey = @ForeignKey(name = "fk_scraper_logs_run"))
    private ScraperRun scraperRun;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "rckik_id", foreignKey = @ForeignKey(name = "fk_scraper_logs_rckik"))
    private Rckik rckik;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String url;

    @Column(nullable = false, length = 50)
    private String status;

    @Column(name = "error_message", columnDefinition = "TEXT")
    private String errorMessage;

    @Column(name = "parser_version", length = 50)
    private String parserVersion;

    @Column(name = "response_time_ms")
    private Integer responseTimeMs;

    @Column(name = "http_status_code")
    private Integer httpStatusCode;

    @Column(name = "records_parsed")
    private Integer recordsParsed;

    @Column(name = "records_failed")
    private Integer recordsFailed;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "JSONB")
    private String metadata;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
