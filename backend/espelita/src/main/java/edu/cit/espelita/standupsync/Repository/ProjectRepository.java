package edu.cit.espelita.standupsync.Repository;

import edu.cit.espelita.standupsync.Entity.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByUserId(Long userId);
}
