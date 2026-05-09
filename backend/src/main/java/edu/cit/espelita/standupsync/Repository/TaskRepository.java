package edu.cit.espelita.standupsync.Repository;

import edu.cit.espelita.standupsync.Entity.Task;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {
    List<Task> findByUserId(Long userId);
    List<Task> findByUserIdAndProjectId(Long userId, Long projectId);
    List<Task> findByTeamId(Long teamId);
    List<Task> findByAssignedUserId(Long assignedUserId);
    List<Task> findByTeamIdAndAssignedUserId(Long teamId, Long assignedUserId);
    // Manager view: only non-personal tasks
    List<Task> findByTeamIdAndPersonalFalse(Long teamId);
}
