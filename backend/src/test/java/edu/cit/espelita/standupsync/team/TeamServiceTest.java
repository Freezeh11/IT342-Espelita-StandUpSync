package edu.cit.espelita.standupsync.team;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.task.entity.Task;
import edu.cit.espelita.standupsync.team.dto.TeamDto;
import edu.cit.espelita.standupsync.team.dto.TeamMemberDto;
import edu.cit.espelita.standupsync.user.UserRepository;
import edu.cit.espelita.standupsync.user.UserService;
import edu.cit.espelita.standupsync.user.entity.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ContextConfiguration(initializers = TestEnvConfig.class)
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class TeamServiceTest {

    @Autowired private TeamService teamService;
    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;

    private User registerUser(String suffix, String role) {
        User u = new User();
        u.setUsername("teamuser_" + suffix + "_" + System.nanoTime());
        u.setEmail(suffix + "@test.com");
        u.setPassword("TestPass1!");
        u.setRole(role);
        return userService.registerUser(u);
    }

    private User createAdminUser(String suffix) {
        User u = new User();
        u.setUsername("adminuser_" + suffix + "_" + System.nanoTime());
        u.setEmail(suffix + "_admin@test.com");
        u.setPassword("TestPass1!");
        u.setRole("ADMIN");
        User saved = userService.registerUser(u);
        saved.setRole("ADMIN");
        return userRepository.save(saved);
    }

    @Test @Order(1)
    @DisplayName("FR-14: Manager creates team with auto-generated code")
    void createTeam_success() {
        User mgr = registerUser("mgr", "MANAGER");
        TeamDto team = teamService.createTeam("Alpha Team", mgr.getUsername());

        assertNotNull(team.getId());
        assertEquals("Alpha Team", team.getName());
        assertNotNull(team.getTeamCode());
        assertEquals(6, team.getTeamCode().length());
        assertEquals(mgr.getId(), team.getManagerId());
    }

    @Test @Order(2)
    @DisplayName("FR-14: Regular USER cannot create team")
    void createTeam_forbiddenForUser() {
        User u = registerUser("usr", "USER");
        assertThrows(ResponseStatusException.class, () ->
                teamService.createTeam("Bad Team", u.getUsername()));
    }

    @Test @Order(3)
    @DisplayName("FR-15: User joins team with valid code")
    void joinTeam_success() {
        User mgr = registerUser("mgr2", "MANAGER");
        TeamDto team = teamService.createTeam("Beta Team", mgr.getUsername());

        User member = registerUser("mem", "USER");
        TeamDto joined = teamService.joinTeam(team.getTeamCode(), member.getUsername());
        assertEquals(team.getId(), joined.getId());
    }

    @Test @Order(4)
    @DisplayName("FR-15: Duplicate join is rejected")
    void joinTeam_duplicateRejected() {
        User mgr = registerUser("mgr3", "MANAGER");
        TeamDto team = teamService.createTeam("Gamma Team", mgr.getUsername());

        User member = registerUser("mem2", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        assertThrows(ResponseStatusException.class, () ->
                teamService.joinTeam(team.getTeamCode(), member.getUsername()));
    }

    @Test @Order(5)
    @DisplayName("FR-15: Invalid team code is rejected")
    void joinTeam_invalidCode() {
        User u = registerUser("bad", "USER");
        assertThrows(ResponseStatusException.class, () ->
                teamService.joinTeam("XXXXXX", u.getUsername()));
    }

    @Test @Order(6)
    @DisplayName("FR-16: Get team members includes manager and members")
    void getTeamMembers_success() {
        User mgr = registerUser("mgr4", "MANAGER");
        TeamDto team = teamService.createTeam("Delta Team", mgr.getUsername());

        User m1 = registerUser("m1", "USER");
        User m2 = registerUser("m2", "USER");
        teamService.joinTeam(team.getTeamCode(), m1.getUsername());
        teamService.joinTeam(team.getTeamCode(), m2.getUsername());

        List<TeamMemberDto> members = teamService.getTeamMembers(team.getId(), mgr.getUsername());
        assertEquals(3, members.size());
        assertEquals("MANAGER", members.get(0).getMemberRole());
    }

    @Test @Order(7)
    @DisplayName("FR-17: Manager removes member from team")
    void removeMember_success() {
        User mgr = registerUser("mgr5", "MANAGER");
        TeamDto team = teamService.createTeam("Epsilon Team", mgr.getUsername());

        User member = registerUser("rm", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        teamService.removeMember(team.getId(), member.getId(), mgr.getUsername());

        List<TeamMemberDto> remaining = teamService.getTeamMembers(team.getId(), mgr.getUsername());
        assertEquals(1, remaining.size());
    }

    @Test @Order(8)
    @DisplayName("FR-19: Manager renames team")
    void updateTeam_rename() {
        User mgr = registerUser("mgr6", "MANAGER");
        TeamDto team = teamService.createTeam("Old Name", mgr.getUsername());

        TeamDto updated = teamService.updateTeam(team.getId(), "New Name", mgr.getUsername());
        assertEquals("New Name", updated.getName());
    }

    @Test @Order(9)
    @DisplayName("FR-20: Admin changes team manager")
    void changeManager_success() {
        User admin = createAdminUser("admin");
        User mgr = registerUser("mgr7", "MANAGER");
        User newMgr = registerUser("newmgr", "MANAGER");

        TeamDto team = teamService.createTeam("Zeta Team", mgr.getUsername());
        TeamDto updated = teamService.changeManager(team.getId(), newMgr.getId(), admin.getUsername());
        assertEquals(newMgr.getId(), updated.getManagerId());
    }

    @Test @Order(10)
    @DisplayName("FR-21: Manager creates pending (unassigned) team task")
    void createPendingTask_success() {
        User mgr = registerUser("mgr8", "MANAGER");
        TeamDto team = teamService.createTeam("Eta Team", mgr.getUsername());

        Task task = new Task();
        task.setTitle("Team Task");
        task.setDescription("Do something");

        Task saved = teamService.createPendingTask(team.getId(), task, mgr.getUsername());
        assertNotNull(saved.getId());
        assertEquals("pending", saved.getStatus());
        assertNull(saved.getAssignedUserId());
        assertEquals(team.getId(), saved.getTeamId());
    }

    @Test @Order(11)
    @DisplayName("FR-23: Member self-assigns (takes) pending task")
    void takeTask_success() {
        User mgr = registerUser("mgr9", "MANAGER");
        TeamDto team = teamService.createTeam("Theta Team", mgr.getUsername());

        User member = registerUser("take", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        Task task = new Task(); task.setTitle("Takeable");
        Task pending = teamService.createPendingTask(team.getId(), task, mgr.getUsername());

        Task taken = teamService.takeTask(team.getId(), pending.getId(), member.getUsername());
        assertEquals(member.getId(), taken.getAssignedUserId());
        assertEquals("inProgress", taken.getStatus());
    }

    @Test @Order(12)
    @DisplayName("FR-23: Cannot take already-assigned task")
    void takeTask_alreadyAssigned() {
        User mgr = registerUser("mgr10", "MANAGER");
        TeamDto team = teamService.createTeam("Iota Team", mgr.getUsername());

        User m1 = registerUser("m1t", "USER");
        User m2 = registerUser("m2t", "USER");
        teamService.joinTeam(team.getTeamCode(), m1.getUsername());
        teamService.joinTeam(team.getTeamCode(), m2.getUsername());

        Task task = new Task(); task.setTitle("Contest");
        Task pending = teamService.createPendingTask(team.getId(), task, mgr.getUsername());

        teamService.takeTask(team.getId(), pending.getId(), m1.getUsername());

        assertThrows(ResponseStatusException.class, () ->
                teamService.takeTask(team.getId(), pending.getId(), m2.getUsername()));
    }

    @Test @Order(13)
    @DisplayName("FR-24: Member creates personal team task")
    void createPersonalTask_success() {
        User mgr = registerUser("mgr11", "MANAGER");
        TeamDto team = teamService.createTeam("Kappa Team", mgr.getUsername());

        User member = registerUser("pers", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        Task task = new Task(); task.setTitle("Private Task"); task.setStatus("inProgress");
        Task saved = teamService.createPersonalTask(team.getId(), task, member.getUsername());

        assertTrue(saved.isPersonal());
        assertEquals(member.getId(), saved.getAssignedUserId());
    }

    @Test @Order(14)
    @DisplayName("FR-26: getTeamTasks excludes personal tasks")
    void getTeamTasks_excludesPersonal() {
        User mgr = registerUser("mgr12", "MANAGER");
        TeamDto team = teamService.createTeam("Lambda Team", mgr.getUsername());

        User member = registerUser("vis", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        Task official = new Task(); official.setTitle("Official");
        teamService.createPendingTask(team.getId(), official, mgr.getUsername());

        Task personal = new Task(); personal.setTitle("Private"); personal.setStatus("inProgress");
        teamService.createPersonalTask(team.getId(), personal, member.getUsername());

        List<Task> managerView = teamService.getTeamTasks(team.getId(), mgr.getUsername());
        assertEquals(1, managerView.size());
        assertEquals("Official", managerView.get(0).getTitle());
    }

    @Test @Order(15)
    @DisplayName("FR-25: Assignee updates team task status")
    void updateTeamTask_byAssignee() {
        User mgr = registerUser("mgr13", "MANAGER");
        TeamDto team = teamService.createTeam("Mu Team", mgr.getUsername());

        User member = registerUser("updm", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        Task task = new Task(); task.setTitle("Update Me");
        Task pending = teamService.createPendingTask(team.getId(), task, mgr.getUsername());
        Task taken = teamService.takeTask(team.getId(), pending.getId(), member.getUsername());

        Task upd = new Task(); upd.setTitle("Update Me"); upd.setStatus("done");
        Task result = teamService.updateTeamTask(team.getId(), taken.getId(), upd, member.getUsername());
        assertEquals("done", result.getStatus());
    }

    @Test @Order(16)
    @DisplayName("FR-18: Manager deletes team and all its tasks")
    void deleteTeam_cascade() {
        User mgr = registerUser("mgr14", "MANAGER");
        TeamDto team = teamService.createTeam("Nu Team", mgr.getUsername());

        User member = registerUser("delt", "USER");
        teamService.joinTeam(team.getTeamCode(), member.getUsername());

        Task task = new Task(); task.setTitle("Team Task");
        teamService.createPendingTask(team.getId(), task, mgr.getUsername());

        assertDoesNotThrow(() -> teamService.deleteTeam(team.getId(), mgr.getUsername()));

        assertThrows(ResponseStatusException.class, () ->
                teamService.getTeamMembers(team.getId(), mgr.getUsername()));
    }
}