package edu.cit.espelita.standupsync;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ContextConfiguration;

@SpringBootTest
@ContextConfiguration(initializers = TestEnvConfig.class)
class EspelitaApplicationTests {

    @Test
    @DisplayName("Application context loads successfully after refactoring")
    void contextLoads() {
    }

}
