package edu.cit.espelita.standupsync.team.entity;

import edu.cit.espelita.standupsync.user.entity.User;
import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "team_members",
       uniqueConstraints = @UniqueConstraint(columnNames = {"team_id", "user_id"}))
@Data
public class TeamMember {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "team_id", nullable = false)
    private Team team;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // Role within the team: MEMBER (managers are identified via Team.manager)
    @Column(nullable = false)
    private String memberRole = "MEMBER";
}
