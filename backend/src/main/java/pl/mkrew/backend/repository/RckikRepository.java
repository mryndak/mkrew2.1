package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.Rckik;

import java.util.List;
import java.util.Optional;

@Repository
public interface RckikRepository extends JpaRepository<Rckik, Long> {

    Optional<Rckik> findByCode(String code);

    List<Rckik> findByActiveTrue();

    List<Rckik> findByIdIn(List<Long> ids);
}
