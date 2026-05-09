package edu.cit.espelita.standupsync.Controller;

import edu.cit.espelita.standupsync.Dto.TeamDto;
import edu.cit.espelita.standupsync.Dto.TeamMemberDto;
import edu.cit.espelita.standupsync.Entity.Task;
import edu.cit.espelita.standupsync.Service.TeamService;
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

    // Manager: create team
    @PostMapping
    public ResponseEntity<TeamDto> createTeam(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.createTeam(body.get("name"), currentUsername()));
    }

    // Any role: get my teams
    @GetMapping("/my")
    public ResponseEntity<List<TeamDto>> getMyTeams() {
        return ResponseEntity.ok(teamService.getMyTeams(currentUsername()));
    }

    // Admin: get all teams
    @GetMapping
    public ResponseEntity<List<TeamDto>> getAllTeams() {
        return ResponseEntity.ok(teamService.getAllTeams(currentUsername()));
    }

    // Manager/Admin/Member: get team members
    @GetMapping("/{id}/members")
    public ResponseEntity<List<TeamMemberDto>> getTeamMembers(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamMembers(id, currentUsername()));
    }

    // User: join team via code
    @PostMapping("/join")
    public ResponseEntity<TeamDto> joinTeam(@RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.joinTeam(body.get("teamCode"), currentUsername()));
    }

    // Manager/Admin: remove member
    @DeleteMapping("/{id}/members/{userId}")
    public ResponseEntity<Void> removeMember(@PathVariable Long id, @PathVariable Long userId) {
        teamService.removeMember(id, userId, currentUsername());
        return ResponseEntity.noContent().build();
    }

    // Manager/Admin: delete team
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteTeam(@PathVariable Long id) {
        teamService.deleteTeam(id, currentUsername());
        return ResponseEntity.noContent().build();
    }

    // Manager/Admin: update team name
    @PutMapping("/{id}")
    public ResponseEntity<TeamDto> updateTeam(@PathVariable Long id, @RequestBody Map<String, String> body) {
        return ResponseEntity.ok(teamService.updateTeam(id, body.get("name"), currentUsername()));
    }

    // Admin: change team manager
    @PutMapping("/{id}/manager")
    public ResponseEntity<TeamDto> changeManager(@PathVariable Long id, @RequestBody Map<String, Long> body) {
        return ResponseEntity.ok(teamService.changeManager(id, body.get("newManagerId"), currentUsername()));
    }

    // Manager/Admin: create a pending (unassigned) task
    @PostMapping("/{id}/tasks")
    public ResponseEntity<Task> createPendingTask(
            @PathVariable Long id,
            @RequestBody Task task) {
        return ResponseEntity.ok(teamService.createPendingTask(id, task, currentUsername()));
    }

    // Manager/Admin: assign a pending task to a specific member
    @PutMapping("/{id}/tasks/{taskId}/assign")
    public ResponseEntity<Task> assignTaskToMember(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestParam Long userId) {
        return ResponseEntity.ok(teamService.assignTaskToMember(id, taskId, userId, currentUsername()));
    }

    // Member: self-assign (take) a pending task
    @PutMapping("/{id}/tasks/{taskId}/take")
    public ResponseEntity<Task> takeTask(
            @PathVariable Long id,
            @PathVariable Long taskId) {
        return ResponseEntity.ok(teamService.takeTask(id, taskId, currentUsername()));
    }

    // Manager/Admin/Member: get team tasks (manager view excludes personal)
    @GetMapping("/{id}/tasks")
    public ResponseEntity<List<Task>> getTeamTasks(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getTeamTasks(id, currentUsername()));
    }

    // Member: get MY full team project board (assigned + personal tasks)
    @GetMapping("/{id}/my-tasks")
    public ResponseEntity<List<Task>> getMyTeamTasks(@PathVariable Long id) {
        return ResponseEntity.ok(teamService.getMyTeamTasks(id, currentUsername()));
    }

    // Member: create a personal (private) task in their team project
    @PostMapping("/{id}/my-tasks")
    public ResponseEntity<Task> createPersonalTask(@PathVariable Long id, @RequestBody Task task) {
        return ResponseEntity.ok(teamService.createPersonalTask(id, task, currentUsername()));
    }

    // Manager/Admin: delete team task
    @DeleteMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<Void> deleteTeamTask(@PathVariable Long id, @PathVariable Long taskId) {
        teamService.deleteTeamTask(id, taskId, currentUsername());
        return ResponseEntity.noContent().build();
    }

    // Assigned user/Manager/Admin: update team task
    @PutMapping("/{id}/tasks/{taskId}")
    public ResponseEntity<Task> updateTeamTask(
            @PathVariable Long id,
            @PathVariable Long taskId,
            @RequestBody Task task) {
        return ResponseEntity.ok(teamService.updateTeamTask(id, taskId, task, currentUsername()));
    }
}
