package edu.cit.espelita.standupsync.Dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class TeamDto {
    private Long id;
    private String name;
    private String teamCode;
    private Long managerId;
    private String managerUsername;
    private String managerDisplayName;
    private int memberCount;
    private LocalDateTime createdAt;
}
