package edu.cit.espelita.standupsync.user;

import edu.cit.espelita.standupsync.user.entity.User;
import edu.cit.espelita.standupsync.user.entity.UserProfile;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Collections;
import java.util.List;

@Service
public class UserService implements UserDetailsService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private UserProfileRepository userProfileRepository;

    public User registerUser(User user) {
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        String role = user.getRole();
        if (role == null || (!role.equals("USER") && !role.equals("MANAGER"))) {
            user.setRole("USER");
        }
        return userRepository.save(user);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));

        return new org.springframework.security.core.userdetails.User(
                user.getUsername(),
                user.getPassword(),
                Collections.emptyList());
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username).orElse(null);
    }

    public String getProfilePic(User user) {
        return userProfileRepository.findByUser(user)
                .map(UserProfile::getProfilePic)
                .orElse(null);
    }

    public void updateProfilePic(User user, String profilePic) {
        UserProfile profile = userProfileRepository.findByUser(user)
                .orElseGet(() -> {
                    UserProfile p = new UserProfile();
                    p.setUser(user);
                    return p;
                });
        profile.setProfilePic(profilePic);
        userProfileRepository.save(profile);
    }

    public User updateCurrentUser(String currentUsername, String displayName, String newEmail,
            String currentPassword, String newPassword) {
        User user = userRepository.findByUsername(currentUsername)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (displayName != null) {
            user.setDisplayName(displayName.isBlank() ? null : displayName);
        }
        if (newEmail != null && !newEmail.isBlank()) {
            user.setEmail(newEmail);
        }
        if (currentPassword != null && !currentPassword.isBlank()
                && newPassword != null && !newPassword.isBlank()) {
            if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
                throw new RuntimeException("Current password is incorrect");
            }
            user.setPassword(passwordEncoder.encode(newPassword));
        }
        return userRepository.save(user);
    }

    public List<User> getAllUsers(String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        return userRepository.findAll();
    }

    public User changeUserRole(Long userId, String newRole, String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        if (!List.of("USER", "MANAGER", "ADMIN").contains(newRole)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Invalid role: " + newRole);
        }
        User target = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));
        target.setRole(newRole);
        return userRepository.save(target);
    }

    public void deleteUser(Long userId, String requesterUsername) {
        User requester = userRepository.findByUsername(requesterUsername)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
        if (!"ADMIN".equals(requester.getRole())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Admin access required");
        }
        userRepository.deleteById(userId);
    }
}
