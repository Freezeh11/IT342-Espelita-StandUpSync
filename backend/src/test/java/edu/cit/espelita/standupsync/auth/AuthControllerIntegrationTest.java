package edu.cit.espelita.standupsync.auth;

import edu.cit.espelita.standupsync.TestEnvConfig;
import edu.cit.espelita.standupsync.user.entity.User;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ContextConfiguration(initializers = TestEnvConfig.class)
@Transactional
@TestMethodOrder(MethodOrderer.OrderAnnotation.class)
class AuthControllerIntegrationTest {

    @Autowired private MockMvc mockMvc;

    private String uniqueUsername() {
        return "authtest_" + System.nanoTime();
    }

    @Test @Order(1)
    @DisplayName("FR-01 [API]: Register new user returns 200")
    void register_success() throws Exception {
        String username = uniqueUsername();
        String json = """
            {"username":"%s","email":"test@test.com","password":"Pass123!","role":"USER"}
            """.formatted(username);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value(username))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test @Order(2)
    @DisplayName("FR-01 [API]: Duplicate username returns 400")
    void register_duplicate() throws Exception {
        String username = uniqueUsername();
        String json = """
            {"username":"%s","email":"dup@test.com","password":"Pass123!","role":"USER"}
            """.formatted(username);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isBadRequest());
    }
    @Test @Order(3)
    @DisplayName("FR-02 [API]: Login endpoint returns 200")
    void login_success() throws Exception {
        String json = """
            {"username":"anyuser","password":"anypass"}
            """;

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON).content(json))
                .andExpect(status().isOk());
    }

    @Test @Order(4)
    @DisplayName("FR-04 [API]: Unauthenticated /api/user/me returns 401")
    void getCurrentUser_unauthenticated() throws Exception {
        mockMvc.perform(get("/api/user/me"))
                .andExpect(status().isUnauthorized());
    }
}
