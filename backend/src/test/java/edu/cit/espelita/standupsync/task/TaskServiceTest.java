package edu.cit.espelita.standupsync.task;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.project.ProjectService;
import edu.cit.espelita.standupsync.project.entity.Project;
import edu.cit.espelita.standupsync.task.entity.Task;
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
class TaskServiceTest {

    @Autowired private TaskService taskService;
    @Autowired private UserService userService;
    @Autowired private ProjectService projectService;

    private User registerUser(String suffix) {
        User u = new User();
        u.setUsername("taskuser_" + suffix + "_" + System.nanoTime());
        u.setEmail(suffix + "@test.com");
        u.setPassword("TestPass1!");
        u.setRole("USER");
        return userService.registerUser(u);
    }

    @Test @Order(1)
    @DisplayName("FR-11: Create task successfully")
    void createTask_success() {
        User u = registerUser("create");
        Task t = new Task();
        t.setTitle("My Task");
        t.setDescription("Desc");
        t.setStatus("inProgress");

        Task saved = taskService.createTask(t, u.getUsername());
        assertNotNull(saved.getId());
        assertEquals("My Task", saved.getTitle());
        assertEquals("inProgress", saved.getStatus());
        assertFalse(saved.isBlocked());
    }

    @Test @Order(2)
    @DisplayName("FR-13: Create task with blocker status sets isBlocked=true")
    void createTask_blocker() {
        User u = registerUser("blocker");
        Task t = new Task();
        t.setTitle("Blocked Task");
        t.setStatus("blocker");
        t.setBlockerReason("Waiting on API");

        Task saved = taskService.createTask(t, u.getUsername());
        assertTrue(saved.isBlocked());
        assertEquals("blocker", saved.getStatus());
    }

    @Test @Order(3)
    @DisplayName("FR-12: List tasks returns only user's tasks")
    void getTasksForUser_scoped() {
        User u1 = registerUser("t1");
        User u2 = registerUser("t2");

        Task t1 = new Task(); t1.setTitle("T1"); t1.setStatus("inProgress");
        Task t2 = new Task(); t2.setTitle("T2"); t2.setStatus("inProgress");
        taskService.createTask(t1, u1.getUsername());
        taskService.createTask(t2, u2.getUsername());

        List<Task> u1Tasks = taskService.getTasksForUser(u1.getUsername(), null);
        assertEquals(1, u1Tasks.size());
        assertEquals("T1", u1Tasks.get(0).getTitle());
    }

    @Test @Order(4)
    @DisplayName("FR-12: Filter tasks by projectId")
    void getTasksForUser_byProject() {
        User u = registerUser("proj");
        Project p = new Project(); p.setName("P");
        Project saved = projectService.createProject(p, u.getUsername());

        Task t1 = new Task(); t1.setTitle("In Project"); t1.setStatus("inProgress"); t1.setProjectId(saved.getId());
        Task t2 = new Task(); t2.setTitle("No Project"); t2.setStatus("inProgress");
        taskService.createTask(t1, u.getUsername());
        taskService.createTask(t2, u.getUsername());

        List<Task> filtered = taskService.getTasksForUser(u.getUsername(), saved.getId());
        assertEquals(1, filtered.size());
        assertEquals("In Project", filtered.get(0).getTitle());
    }

    @Test @Order(5)
    @DisplayName("FR-13: Update task status to done")
    void updateTask_statusChange() {
        User u = registerUser("upd");
        Task t = new Task(); t.setTitle("To Do"); t.setStatus("inProgress");
        Task saved = taskService.createTask(t, u.getUsername());

        Task upd = new Task(); upd.setTitle("To Do"); upd.setStatus("done");
        upd.setDescription(saved.getDescription());
        Task result = taskService.updateTask(saved.getId(), upd, u.getUsername());
        assertEquals("done", result.getStatus());
        assertFalse(result.isBlocked());
    }

    @Test @Order(6)
    @DisplayName("FR-13: Update task to blocker sets isBlocked=true")
    void updateTask_setBlocker() {
        User u = registerUser("blk");
        Task t = new Task(); t.setTitle("Normal"); t.setStatus("inProgress");
        Task saved = taskService.createTask(t, u.getUsername());

        Task upd = new Task(); upd.setTitle("Normal"); upd.setStatus("blocker");
        upd.setBlockerReason("Blocked by dependency");
        Task result = taskService.updateTask(saved.getId(), upd, u.getUsername());
        assertTrue(result.isBlocked());
        assertEquals("Blocked by dependency", result.getBlockerReason());
    }

    @Test @Order(7)
    @DisplayName("FR-11: Cannot update another user's task")
    void updateTask_forbiddenForOtherUser() {
        User owner = registerUser("own");
        User other = registerUser("oth");
        Task t = new Task(); t.setTitle("Mine"); t.setStatus("inProgress");
        Task saved = taskService.createTask(t, owner.getUsername());

        Task upd = new Task(); upd.setTitle("Hacked"); upd.setStatus("done");
        assertThrows(ResponseStatusException.class, () ->
                taskService.updateTask(saved.getId(), upd, other.getUsername()));
    }

    @Test @Order(8)
    @DisplayName("FR-11: Delete task successfully")
    void deleteTask_success() {
        User u = registerUser("del");
        Task t = new Task(); t.setTitle("To Delete"); t.setStatus("inProgress");
        Task saved = taskService.createTask(t, u.getUsername());

        taskService.deleteTask(saved.getId(), u.getUsername());
        List<Task> remaining = taskService.getTasksForUser(u.getUsername(), null);
        assertTrue(remaining.isEmpty());
    }

    @Test @Order(9)
    @DisplayName("FR-11: Cannot delete another user's task")
    void deleteTask_forbiddenForOtherUser() {
        User owner = registerUser("own2");
        User other = registerUser("oth2");
        Task t = new Task(); t.setTitle("Protected"); t.setStatus("inProgress");
        Task saved = taskService.createTask(t, owner.getUsername());

        assertThrows(ResponseStatusException.class, () ->
                taskService.deleteTask(saved.getId(), other.getUsername()));
    }
}
