package edu.cit.espelita.standupsync.project;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.user.UserService;
import edu.cit.espelita.standupsync.user.entity.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.httpBasic;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ContextConfiguration(initializers = TestEnvConfig.class)
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class ProjectControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private UserService userService;

    private String testUsername;
    private final String testPassword = "IntegPass1!";

    @BeforeEach
    void setUp() {
        testUsername = "projint_" + System.nanoTime();
        User u = new User();
        u.setUsername(testUsername);
        u.setEmail("proj@int.com");
        u.setPassword(testPassword);
        u.setRole("USER");
        userService.registerUser(u);
    }

    @Test @Order(1)
    @DisplayName("FR-09 [API]: POST /api/projects creates project")
    void createProject_api() throws Exception {
        mockMvc.perform(post("/api/projects")
                        .with(httpBasic(testUsername, testPassword))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"name\":\"API Project\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("API Project"))
                .andExpect(jsonPath("$.id").isNumber());
    }

    @Test @Order(2)
    @DisplayName("FR-09 [API]: GET /api/projects returns user's projects")
    void listProjects_api() throws Exception {
        mockMvc.perform(post("/api/projects")
                .with(httpBasic(testUsername, testPassword))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Listed Project\"}"))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/projects")
                        .with(httpBasic(testUsername, testPassword)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Listed Project"));
    }

    @Test @Order(3)
    @DisplayName("FR-09 [API]: Unauthenticated request returns 401")
    void listProjects_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/projects"))
                .andExpect(status().isUnauthorized());
    }
}
