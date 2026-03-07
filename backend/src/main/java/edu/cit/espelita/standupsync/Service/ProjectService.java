package edu.cit.espelita.standupsync.Service;

import edu.cit.espelita.standupsync.Entity.Project;
import edu.cit.espelita.standupsync.Entity.User;
import edu.cit.espelita.standupsync.Repository.ProjectRepository;
import edu.cit.espelita.standupsync.Repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private UserRepository userRepository;

    private User resolveUser(String username) {
        return userRepository.findByUsername(username)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User not found"));
    }

    public List<Project> getProjectsForUser(String username) {
        User user = resolveUser(username);
        return projectRepository.findByUserId(user.getId());
    }

    public Project createProject(Project project, String username) {
        User user = resolveUser(username);
        project.setUser(user);
        return projectRepository.save(project);
    }

    public Project updateProject(Long id, Project updated, String username) {
        User user = resolveUser(username);
        Project existing = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this project");
        }

        existing.setName(updated.getName());
        return projectRepository.save(existing);
    }

    public void deleteProject(Long id, String username) {
        User user = resolveUser(username);
        Project existing = projectRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Project not found"));

        if (!existing.getUser().getId().equals(user.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You do not own this project");
        }

        projectRepository.delete(existing);
    }
}
