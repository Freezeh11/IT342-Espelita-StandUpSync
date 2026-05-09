package edu.cit.espelita.standupsync.user;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.user.entity.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ContextConfiguration(initializers = TestEnvConfig.class)
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class UserServiceTest {

    @Autowired private UserService userService;
    @Autowired private UserRepository userRepository;
    @Autowired private PasswordEncoder passwordEncoder;

    private User createTestUser(String suffix) {
        User u = new User();
        u.setUsername("testuser_" + suffix + "_" + System.nanoTime());
        u.setEmail(suffix + "@test.com");
        u.setPassword("TestPass1!");
        u.setRole("USER");
        return u;
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
    @DisplayName("FR-01: Register user — password is hashed, default role is USER")
    void registerUser_success() {
        User u = createTestUser("reg");
        User saved = userService.registerUser(u);

        assertNotNull(saved.getId(), "Saved user must have an ID");
        assertTrue(passwordEncoder.matches("TestPass1!", saved.getPassword()),
                "Password must be BCrypt-encoded");
        assertEquals("USER", saved.getRole());
    }

    @Test @Order(2)
    @DisplayName("FR-01: Register user — invalid role defaults to USER")
    void registerUser_invalidRoleDefaultsToUser() {
        User u = createTestUser("role");
        u.setRole("SUPERADMIN");
        User saved = userService.registerUser(u);
        assertEquals("USER", saved.getRole());
    }

    @Test @Order(3)
    @DisplayName("FR-01: Register user — MANAGER role is preserved")
    void registerUser_managerRolePreserved() {
        User u = createTestUser("mgr");
        u.setRole("MANAGER");
        User saved = userService.registerUser(u);
        assertEquals("MANAGER", saved.getRole());
    }

    @Test @Order(4)
    @DisplayName("FR-04: findByUsername returns correct user")
    void findByUsername_existing() {
        User u = createTestUser("find");
        userService.registerUser(u);
        User found = userService.findByUsername(u.getUsername());
        assertNotNull(found);
        assertEquals(u.getUsername(), found.getUsername());
    }

    @Test @Order(5)
    @DisplayName("FR-04: findByUsername returns null for unknown")
    void findByUsername_unknown() {
        assertNull(userService.findByUsername("nonexistent_" + System.nanoTime()));
    }

    @Test @Order(6)
    @DisplayName("FR-05: Update displayName and email")
    void updateCurrentUser_basicFields() {
        User u = createTestUser("upd");
        userService.registerUser(u);

        User updated = userService.updateCurrentUser(
                u.getUsername(), "New Name", "new@email.com", null, null);
        assertEquals("New Name", updated.getDisplayName());
        assertEquals("new@email.com", updated.getEmail());
    }

    @Test @Order(7)
    @DisplayName("FR-05: Change password — correct current password")
    void updateCurrentUser_changePassword() {
        User u = createTestUser("pwd");
        userService.registerUser(u);

        User updated = userService.updateCurrentUser(
                u.getUsername(), null, null, "TestPass1!", "NewPass2@");
        assertTrue(passwordEncoder.matches("NewPass2@", updated.getPassword()));
    }

    @Test @Order(8)
    @DisplayName("FR-05: Change password — wrong current password throws")
    void updateCurrentUser_wrongPassword() {
        User u = createTestUser("wpwd");
        userService.registerUser(u);

        assertThrows(RuntimeException.class, () ->
                userService.updateCurrentUser(u.getUsername(), null, null, "WrongOld!", "NewPass2@"));
    }

    @Test @Order(9)
    @DisplayName("FR-06: Admin can list all users")
    void getAllUsers_asAdmin() {
        User admin = createAdminUser("adm");
        assertDoesNotThrow(() -> userService.getAllUsers(admin.getUsername()));
    }

    @Test @Order(10)
    @DisplayName("FR-06: Non-admin cannot list all users")
    void getAllUsers_asUser_forbidden() {
        User u = createTestUser("usr");
        userService.registerUser(u);

        assertThrows(ResponseStatusException.class, () ->
                userService.getAllUsers(u.getUsername()));
    }

    @Test @Order(11)
    @DisplayName("FR-07: Admin changes user role to MANAGER")
    void changeUserRole_success() {
        User admin = createAdminUser("adm2");

        User target = createTestUser("target");
        userService.registerUser(target);

        User updated = userService.changeUserRole(target.getId(), "MANAGER", admin.getUsername());
        assertEquals("MANAGER", updated.getRole());
    }

    @Test @Order(12)
    @DisplayName("FR-07: Invalid role is rejected")
    void changeUserRole_invalidRole() {
        User admin = createAdminUser("adm3");

        User target = createTestUser("target2");
        userService.registerUser(target);

        assertThrows(ResponseStatusException.class, () ->
                userService.changeUserRole(target.getId(), "SUPERADMIN", admin.getUsername()));
    }

    @Test @Order(13)
    @DisplayName("FR-08: Admin deletes user")
    void deleteUser_success() {
        User admin = createAdminUser("adm4");

        User target = createTestUser("del");
        userService.registerUser(target);

        userService.deleteUser(target.getId(), admin.getUsername());
        assertNull(userService.findByUsername(target.getUsername()));
    }
}