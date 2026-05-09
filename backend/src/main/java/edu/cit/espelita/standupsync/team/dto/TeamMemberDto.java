package edu.cit.espelita.standupsync.team.dto;

import lombok.Data;

@Data
public class TeamMemberDto {
    private Long userId;
    private String username;
    private String displayName;
    private String email;
    private String memberRole; // MEMBER or MANAGER
    private String globalRole; // USER, MANAGER, ADMIN
}
