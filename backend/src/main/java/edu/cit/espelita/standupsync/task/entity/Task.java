package edu.cit.espelita.standupsync.task.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import edu.cit.espelita.standupsync.user.entity.User;
import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "tasks")
@Data
public class Task {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "project_id")
    private Long projectId;

    @Column(name = "team_id")
    private Long teamId;

    @Column(name = "assigned_user_id")
    private Long assignedUserId;

    @Column(name = "personal", columnDefinition = "boolean default false")
    private boolean personal = false;

    @Column(nullable = false)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(nullable = false)
    private String status = "inProgress";

    @Column(nullable = false)
    private boolean isBlocked = false;

    @Column(columnDefinition = "TEXT")
    private String blockerReason;

    @Column(nullable = false)
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
