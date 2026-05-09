package edu.cit.espelita.standupsync.user;

import edu.cit.espelita.standupsync.user.entity.User;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    private String currentUsername() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth.getName();
    }

    private Map<String, Object> userToMap(User user, String profilePic) {
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("displayName", user.getDisplayName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("profilePic", profilePic);
        return response;
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        User user = userService.findByUsername(currentUsername());
        String profilePic = userService.getProfilePic(user);
        return ResponseEntity.ok(userToMap(user, profilePic));
    }

    @PutMapping("/me")
    public ResponseEntity<?> updateCurrentUser(@RequestBody Map<String, String> body) {
        try {
            User updated = userService.updateCurrentUser(
                    currentUsername(),
                    body.get("displayName"),
                    body.get("email"),
                    body.get("currentPassword"),
                    body.get("newPassword"));

            if (body.containsKey("profilePic")) {
                userService.updateProfilePic(updated, body.get("profilePic"));
            }

            String profilePic = userService.getProfilePic(updated);
            return ResponseEntity.ok(userToMap(updated, profilePic));
        } catch (RuntimeException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/all")
    public ResponseEntity<?> getAllUsers() {
        List<Map<String, Object>> users = userService.getAllUsers(currentUsername()).stream()
                .map(u -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", u.getId());
                    m.put("username", u.getUsername());
                    m.put("displayName", u.getDisplayName());
                    m.put("email", u.getEmail());
                    m.put("role", u.getRole());
                    return m;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(users);
    }

    @PutMapping("/{id}/role")
    public ResponseEntity<?> changeUserRole(@PathVariable Long id, @RequestBody Map<String, String> body) {
        User updated = userService.changeUserRole(id, body.get("role"), currentUsername());
        return ResponseEntity.ok(userToMap(updated, userService.getProfilePic(updated)));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        userService.deleteUser(id, currentUsername());
        return ResponseEntity.noContent().build();
    }
}
