package edu.cit.espelita.standupsync.project;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.project.entity.Project;
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
class ProjectServiceTest {

    @Autowired private ProjectService projectService;
    @Autowired private UserService userService;

    private User registerUser(String suffix) {
        User u = new User();
        u.setUsername("projuser_" + suffix + "_" + System.nanoTime());
        u.setEmail(suffix + "@test.com");
        u.setPassword("TestPass1!");
        u.setRole("USER");
        return userService.registerUser(u);
    }

    @Test @Order(1)
    @DisplayName("FR-09: Create project successfully")
    void createProject_success() {
        User u = registerUser("create");
        Project p = new Project();
        p.setName("Test Project");

        Project saved = projectService.createProject(p, u.getUsername());
        assertNotNull(saved.getId());
        assertEquals("Test Project", saved.getName());
        assertNotNull(saved.getCreatedAt());
    }

    @Test @Order(2)
    @DisplayName("FR-09: List projects returns only user's projects")
    void getProjectsForUser_scoped() {
        User u1 = registerUser("list1");
        User u2 = registerUser("list2");

        Project p1 = new Project(); p1.setName("P1");
        Project p2 = new Project(); p2.setName("P2");
        projectService.createProject(p1, u1.getUsername());
        projectService.createProject(p2, u2.getUsername());

        List<Project> u1Projects = projectService.getProjectsForUser(u1.getUsername());
        assertEquals(1, u1Projects.size());
        assertEquals("P1", u1Projects.get(0).getName());
    }

    @Test @Order(3)
    @DisplayName("FR-09: Update project name")
    void updateProject_success() {
        User u = registerUser("upd");
        Project p = new Project(); p.setName("Old Name");
        Project saved = projectService.createProject(p, u.getUsername());

        Project updated = new Project(); updated.setName("New Name");
        Project result = projectService.updateProject(saved.getId(), updated, u.getUsername());
        assertEquals("New Name", result.getName());
    }

    @Test @Order(4)
    @DisplayName("FR-10: Cannot update another user's project")
    void updateProject_forbiddenForOtherUser() {
        User owner = registerUser("own");
        User other = registerUser("oth");
        Project p = new Project(); p.setName("Mine");
        Project saved = projectService.createProject(p, owner.getUsername());

        Project upd = new Project(); upd.setName("Hacked");
        assertThrows(ResponseStatusException.class, () ->
                projectService.updateProject(saved.getId(), upd, other.getUsername()));
    }

    @Test @Order(5)
    @DisplayName("FR-09: Delete project successfully")
    void deleteProject_success() {
        User u = registerUser("del");
        Project p = new Project(); p.setName("To Delete");
        Project saved = projectService.createProject(p, u.getUsername());

        projectService.deleteProject(saved.getId(), u.getUsername());
        List<Project> remaining = projectService.getProjectsForUser(u.getUsername());
        assertTrue(remaining.isEmpty());
    }

    @Test @Order(6)
    @DisplayName("FR-10: Cannot delete another user's project")
    void deleteProject_forbiddenForOtherUser() {
        User owner = registerUser("own2");
        User other = registerUser("oth2");
        Project p = new Project(); p.setName("Protected");
        Project saved = projectService.createProject(p, owner.getUsername());

        assertThrows(ResponseStatusException.class, () ->
                projectService.deleteProject(saved.getId(), other.getUsername()));
    }
}
