package edu.cit.espelita.standupsync.Controller;

import edu.cit.espelita.standupsync.Entity.User;
import edu.cit.espelita.standupsync.Service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        User user = userService.findByUsername(auth.getName());
        String profilePic = userService.getProfilePic(user);

        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("profilePic", profilePic);

        return ResponseEntity.ok(response);
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(@RequestBody Map<String, String> body) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String currentUsername = auth.getName();
        try {
            User updated = userService.updateCurrentUser(
                    currentUsername,
                    body.get("displayName"),
                    body.get("email"),
                    body.get("currentPassword"),
                    body.get("newPassword"));

            if (body.containsKey("profilePic")) {
                userService.updateProfilePic(updated, body.get("profilePic"));
            }

            String profilePic = userService.getProfilePic(updated);
            Map<String, Object> response = new HashMap<>();
            response.put("id", updated.getId());
            response.put("username", updated.getUsername());
            response.put("displayName", updated.getDisplayName());
            response.put("email", updated.getEmail());
            response.put("role", updated.getRole());
            response.put("profilePic", profilePic);

            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
