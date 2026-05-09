package edu.cit.espelita.standupsync.team;

import edu.cit.espelita.standupsync.team.dto.TeamDto;
import edu.cit.espelita.standupsync.team.dto.TeamMemberDto;
import edu.cit.espelita.standupsync.team.entity.*;
import edu.cit.espelita.standupsync.task.entity.Task;
import edu.cit.espelita.standupsync.task.TaskRepository;
import edu.cit.espelita.standupsync.user.entity.User;
import edu.cit.espelita.standupsync.user.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.*;

@Service
public class TeamService {

    @Autowired
    private TeamRepository teamRepository;

    @Autowired
    private TeamMemberRepository teamMemberRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private TaskRepository taskRepository;

    // ─── helpers ──────────────────────────────────────

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    private User resolveUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
    }

    private Team resolveTeam(Long id) {
        return teamRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Team not found"));
    }

    private void assertManagerOrAdmin(User user, Team team) {
        boolean isAdmin = "ADMIN".equals(user.getRole());
        boolean isManager = team.getManager().getId().equals(user.getId());
        if (!isAdmin && !isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
    }

    private void assertAdmin(User user) {
        if (!"ADMIN".equals(user.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
    }

    private String generateTeamCode() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random rnd = new Random();
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) sb.append(chars.charAt(rnd.nextInt(chars.length())));
            code = sb.toString();
        } while (teamRepository.findByTeamCode(code).isPresent());
        return code;
    }

    private TeamDto toDto(Team team) {
        TeamDto dto = new TeamDto();
        dto.setId(team.getId());
        dto.setName(team.getName());
        dto.setTeamCode(team.getTeamCode());
        dto.setManagerId(team.getManager().getId());
        dto.setManagerUsername(team.getManager().getUsername());
        dto.setManagerDisplayName(team.getManager().getDisplayName());
        dto.setMemberCount(teamMemberRepository.findByTeamId(team.getId()).size());
        dto.setCreatedAt(team.getCreatedAt());
        return dto;
    }

    private TeamMemberDto toMemberDto(User user, String memberRole) {
        TeamMemberDto dto = new TeamMemberDto();
        dto.setUserId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setDisplayName(user.getDisplayName());
        dto.setEmail(user.getEmail());
        dto.setMemberRole(memberRole);
        dto.setGlobalRole(user.getRole());
        return dto;
    }

    // ─── manager: create team ──────────────────────────

    public TeamDto createTeam(String name, String managerUsername) {
        User manager = resolveUser(managerUsername);
        if (!"MANAGER".equals(manager.getRole()) && !"ADMIN".equals(manager.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Only managers can create teams");
        }
        // Managers can have multiple teams now
        Team team = new Team();
        team.setName(name);
        team.setManager(manager);
        team.setTeamCode(generateTeamCode());
        return toDto(teamRepository.save(team));
    }

    // ─── user: join team via code ──────────────────────

    @Transactional
    public TeamDto joinTeam(String teamCode, String username) {
        User user = resolveUser(username);
        Team team = teamRepository.findByTeamCode(teamCode.toUpperCase().trim())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Invalid team code"));

        // Already a member?
        if (teamMemberRepository.existsByTeamIdAndUserId(team.getId(), user.getId())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Already a member of this team");
        }
        // Manager joining their own team does not make sense
        if (team.getManager().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "You are the manager of this team");
        }

        TeamMember membership = new TeamMember();
        membership.setTeam(team);
        membership.setUser(user);
        membership.setMemberRole("MEMBER");
        teamMemberRepository.save(membership);
        return toDto(team);
    }

    // ─── get my teams ──────────────────────────────────

    public List<TeamDto> getMyTeams(String username) {
        User user = resolveUser(username);
        // If manager, return all their teams
        if ("MANAGER".equals(user.getRole()) || "ADMIN".equals(user.getRole())) {
            return teamRepository.findByManagerId(user.getId()).stream()
                    .map(this::toDto).toList();
        }
        // If user, find team membership
        List<TeamMember> memberships = teamMemberRepository.findByUserId(user.getId());
        if (memberships.isEmpty()) return List.of();
        return memberships.stream().map(m -> toDto(m.getTeam())).toList();
    }

    // ─── get team members ──────────────────────────────

    public List<TeamMemberDto> getTeamMembers(Long teamId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);

        boolean isAdmin = "ADMIN".equals(requester.getRole());
        boolean isManager = team.getManager().getId().equals(requester.getId());
        boolean isMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, requester.getId());

        if (!isAdmin && !isManager && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        List<TeamMemberDto> result = new ArrayList<>();
        // Add manager first
        result.add(toMemberDto(team.getManager(), "MANAGER"));
        // Add members
        teamMemberRepository.findByTeamId(teamId).forEach(tm ->
                result.add(toMemberDto(tm.getUser(), tm.getMemberRole())));
        return result;
    }

    // ─── remove member ─────────────────────────────────

    @Transactional
    public void removeMember(Long teamId, Long userId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);

        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Member not found in this team");
        }
        teamMemberRepository.deleteByTeamIdAndUserId(teamId, userId);
    }

    // ─── delete team ───────────────────────────────────

    @Transactional
    public void deleteTeam(Long teamId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);

        // Remove all memberships first
        teamMemberRepository.findByTeamId(teamId).forEach(teamMemberRepository::delete);
        // Remove team tasks
        taskRepository.findByTeamId(teamId).forEach(taskRepository::delete);
        teamRepository.delete(team);
    }

    // ─── update team name ──────────────────────────────

    public TeamDto updateTeam(Long teamId, String name, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);
        team.setName(name);
        return toDto(teamRepository.save(team));
    }

    // ─── admin: change manager ─────────────────────────

    @Transactional
    public TeamDto changeManager(Long teamId, Long newManagerId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        assertAdmin(requester);
        Team team = resolveTeam(teamId);
        User newManager = resolveUserById(newManagerId);
        if (!"MANAGER".equals(newManager.getRole()) && !"ADMIN".equals(newManager.getRole())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "New manager must have MANAGER role");
        }
        // Remove old manager's membership if any and add new manager
        team.setManager(newManager);
        return toDto(teamRepository.save(team));
    }

    // ─── admin: get all teams ──────────────────────────

    public List<TeamDto> getAllTeams(String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        assertAdmin(requester);
        return teamRepository.findAll().stream().map(this::toDto).toList();
    }

    // ─── manager: create a pending (unassigned) task ───

    public Task createPendingTask(Long teamId, Task task, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);

        task.setUser(requester);
        task.setTeamId(teamId);
        task.setAssignedUserId(null); // unassigned / pending
        task.setStatus("pending");
        task.setBlocked(false);
        return taskRepository.save(task);
    }

    // ─── manager: assign a pending task to a member ────

    @Transactional
    public Task assignTaskToMember(Long teamId, Long taskId, Long userId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!teamId.equals(task.getTeamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task does not belong to this team");
        }
        if (!teamMemberRepository.existsByTeamIdAndUserId(teamId, userId)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "User is not a member of this team");
        }

        task.setAssignedUserId(userId);
        task.setStatus("inProgress");
        return taskRepository.save(task);
    }

    // ─── member: self-assign (take) a pending task ─────

    @Transactional
    public Task takeTask(Long teamId, Long taskId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);

        boolean isMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, requester.getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this team");
        }

        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!teamId.equals(task.getTeamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task does not belong to this team");
        }
        if (task.getAssignedUserId() != null) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task is already assigned");
        }

        task.setAssignedUserId(requester.getId());
        task.setStatus("inProgress");
        return taskRepository.save(task);
    }

    // ─── get team tasks (manager view — excludes personal) ───

    public List<Task> getTeamTasks(Long teamId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);

        boolean isAdmin = "ADMIN".equals(requester.getRole());
        boolean isManager = team.getManager().getId().equals(requester.getId());
        boolean isMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, requester.getId());

        if (!isAdmin && !isManager && !isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        // Manager/admin see official tasks only; members see all non-personal team tasks too
        return taskRepository.findByTeamIdAndPersonalFalse(teamId);
    }

    // ─── user: create personal task in team project ───

    public Task createPersonalTask(Long teamId, Task task, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);

        boolean isMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, requester.getId());
        if (!isMember) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You are not a member of this team");
        }

        task.setUser(requester);
        task.setTeamId(teamId);
        task.setAssignedUserId(requester.getId()); // self-assigned
        task.setPersonal(true);  // private — not visible to manager
        task.setStatus(task.getStatus() != null ? task.getStatus() : "inProgress");
        task.setBlocked("blocker".equals(task.getStatus()));
        return taskRepository.save(task);
    }

    // ─── user: get full personal team project board ───
    // Returns both manager-assigned tasks AND user's personal tasks for this team

    public List<Task> getMyTeamTasks(Long teamId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);

        boolean isMember = teamMemberRepository.existsByTeamIdAndUserId(teamId, requester.getId());
        boolean isManager = team.getManager().getId().equals(requester.getId());
        if (!isMember && !isManager) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }
        return taskRepository.findByTeamIdAndAssignedUserId(teamId, requester.getId());
    }

    // ─── delete team task ──────────────────────────────

    @Transactional
    public void deleteTeamTask(Long teamId, Long taskId, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        assertManagerOrAdmin(requester, team);
        Task task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));
        if (!teamId.equals(task.getTeamId())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Task does not belong to this team");
        }
        taskRepository.delete(task);
    }

    // ─── update team task status (by assigned user or manager) ─

    @Transactional
    public Task updateTeamTask(Long teamId, Long taskId, Task updated, String requesterUsername) {
        User requester = resolveUser(requesterUsername);
        Team team = resolveTeam(teamId);
        Task existing = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found"));

        boolean isManagerOrAdmin = team.getManager().getId().equals(requester.getId())
                || "ADMIN".equals(requester.getRole());
        boolean isAssignee = requester.getId().equals(existing.getAssignedUserId());

        if (!isManagerOrAdmin && !isAssignee) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        }

        existing.setTitle(updated.getTitle());
        existing.setDescription(updated.getDescription());
        existing.setStatus(updated.getStatus());
        existing.setBlockerReason(updated.getBlockerReason());
        existing.setBlocked("blocker".equals(updated.getStatus()));
        return taskRepository.save(existing);
    }
}
