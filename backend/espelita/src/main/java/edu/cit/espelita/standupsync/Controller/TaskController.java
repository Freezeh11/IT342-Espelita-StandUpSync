package edu.cit.espelita.standupsync.Controller;

import edu.cit.espelita.standupsync.Entity.Task;
import edu.cit.espelita.standupsync.Service.TaskService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
@CrossOrigin(origins = "http://localhost:5173")
public class TaskController {

    @Autowired
    private TaskService taskService;

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @GetMapping
    public ResponseEntity<List<Task>> getTasks(@RequestParam(required = false) Long projectId) {
        return ResponseEntity.ok(taskService.getTasksForUser(currentUsername(), projectId));
    }

    @PostMapping
    public ResponseEntity<Task> createTask(@RequestBody Task task) {
        return ResponseEntity.ok(taskService.createTask(task, currentUsername()));
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> updateTask(@PathVariable("id") Long id, @RequestBody Task task) {
        return ResponseEntity.ok(taskService.updateTask(id, task, currentUsername()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTask(@PathVariable("id") Long id) {
        taskService.deleteTask(id, currentUsername());
        return ResponseEntity.noContent().build();
    }
}
