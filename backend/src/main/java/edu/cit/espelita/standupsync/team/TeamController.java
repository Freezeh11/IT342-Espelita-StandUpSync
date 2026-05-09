package edu.cit.espelita.standupsync.team;

import edu.cit.espelita.standupsync.team.dto.TeamDto;
import edu.cit.espelita.standupsync.team.dto.TeamMemberDto;
import edu.cit.espelita.standupsync.task.entity.Task;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/teams")
public class TeamController {

    @Autowired
    private TeamService teamService;

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.createTeam(body.get("name"), currentUsername()));
    }

    @GetMapping("/my")
    public ResponseEntity<List<TeamDto>> getMyTeams() {
        return ResponseEntity.ok(teamService.getMyTeams(currentUsername()));
    }

    @GetMapping
    public ResponseEntity<List<TeamDto>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams(currentUsername()));
    }

    @GetMapping("/{id}/members")
    public ResponseEntity<List<TeamMemberDto>> getTeamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamMembers(id, currentUsername()));
    }

    @PostMapping("/join")
    public ResponseEntity<TeamDto> joinTeam(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.joinTeam(body.get("teamCode"), currentUsername()));
    }

    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        teamService.removeMember(id, userId, currentUsername());
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id, currentUsername());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateTeam(id, body.get("name"), currentUsername()));
    }

    @PutMapping("/{id}/manager")
    public ResponseEntity<TeamDto> changeManager(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(teamService.changeManager(id, body.get("newManagerId"), currentUsername()));
    }

    @PostMapping("/{id}/tasks")
    public ResponseEntity<Task> createPendingTask(
            @PathVariable Long id,
            @RequestBody Task task) {
        return ResponseEntity.ok(teamService.createPendingTask(id, task, currentUsername()));
    }

    @PutMapping("/{id}/tasks/{taskId}/assign")
    public ResponseEntity<Task> assignTaskToMember(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(teamService.assignTaskToMember(id, taskId, userId, currentUsername()));
    }

    @PutMapping("/{id}/tasks/{taskId}/take")
    public ResponseEntity<Task> takeTask(
            @PathVariable Long id,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(teamService.takeTask(id, taskId, currentUsername()));
    }

    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<Task>> getTeamTasks(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamTasks(id, currentUsername()));
    }

    @GetMapping("/{id}/my-tasks")
    public ResponseEntity<List<Task>> getMyTeamTasks(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getMyTeamTasks(id, currentUsername()));
    }

    @PostMapping("/{id}/my-tasks")
    public ResponseEntity<Task> createPersonalTask(@PathVariable Long id, @RequestBody Task task) {
        return ResponseEntity.ok(teamService.createPersonalTask(id, task, currentUsername()));
    }

    @DeleteMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTeamTask(@PathVariable Long id, @PathVariable Long taskId) {
        teamService.deleteTeamTask(id, taskId, currentUsername());
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<Task> updateTeamTask(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestBody Task task) {
        return ResponseEntity.ok(teamService.updateTeamTask(id, taskId, task, currentUsername()));
    }
}
