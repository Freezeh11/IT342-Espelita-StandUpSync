package edu.cit.espelita.standupsync.Service;

import edu.cit.espelita.standupsync.Entity.Task;
import edu.cit.espelita.standupsync.Entity.User;
import edu.cit.espelita.standupsync.Repository.TaskRepository;
import edu.cit.espelita.standupsync.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class TaskService {

    @Autowired
    private TaskRepository taskRepository;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public List<Task> getTasksForUser(String username, Long projectId) {
        User user = resolveUser(username);
        if (projectId != null) {
            return taskRepository.findByUserIdAndProjectId(user.getId(), projectId);
        }
        return taskRepository.findByUserId(user.getId());
    }

    public Task createTask(Task task, String username) {
        User user = resolveUser(username);
        task.setUser(user);
        task.setBlocked("blocker".equals(task.getStatus()));
        return taskRepository.save(task);
    }

    public Task updateTask(Long id, Task updated, String username) {
        User user = resolveUser(username);
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this task");
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setStatus(updated.getStatus());
        existing.setBlockerReason(updated.getBlockerReason());
        existing.setBlocked("blocker".equals(updated.getStatus()));
        if (updated.getProjectId() != null) {
            existing.setProjectId(updated.getProjectId());
        }
        return taskRepository.save(existing);
    }

    public void deleteTask(Long id, String username) {
        User user = resolveUser(username);
        Task existing = taskRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this task");
        }

        taskRepository.delete(existing);
    }
}
