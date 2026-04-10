package edu.cit.espelita.standupsync.Repository;

import edu.cit.espelita.standupsync.Entity.User;
import edu.cit.espelita.standupsync.Entity.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {
    Optional<UserProfile> findByUser(User user);
}
