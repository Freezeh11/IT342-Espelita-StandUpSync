package edu.cit.espelita.standupsync.Repository;

import edu.cit.espelita.standupsync.Entity.Team;
import edu.cit.espelita.standupsync.Entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;

public interface TeamRepository extends JpaRepository<Team, Long> {
    List<Team> findByManager(User manager);
    Optional<Team> findByTeamCode(String teamCode);
    List<Team> findByManagerId(Long managerId);
}
