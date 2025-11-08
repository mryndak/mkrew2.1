package pl.mkrew.backend.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import pl.mkrew.backend.entity.UserFavoriteRckik;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserFavoriteRckikRepository extends JpaRepository<UserFavoriteRckik, Long> {

    List<UserFavoriteRckik> findByUserId(Long userId);

    Optional<UserFavoriteRckik> findByUserIdAndRckikId(Long userId, Long rckikId);

    boolean existsByUserIdAndRckikId(Long userId, Long rckikId);

    void deleteByUserIdAndRckikId(Long userId, Long rckikId);
}
