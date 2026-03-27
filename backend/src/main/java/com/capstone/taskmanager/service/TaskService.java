package com.capstone.taskmanager.service;

import com.capstone.taskmanager.model.*;
import com.capstone.taskmanager.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class TaskService {

    private final TaskRepository taskRepo;
    private final UserRepository userRepo;

    public TaskService(TaskRepository taskRepo, UserRepository userRepo) {
        this.taskRepo = taskRepo;
        this.userRepo = userRepo;
    }

    public Task createTask(Task task, String email) {
        User user = userRepo.findByEmail(email).orElseThrow();
        task.setCreatedBy(user);
        task.setStatus(TaskStatus.TODO);
        return taskRepo.save(task);
    }

    public List<Task> getAllTasks() {
        return taskRepo.findAll();
    }

    public Task getTask(Long id) {
        return taskRepo.findById(id).orElseThrow();
    }

    public Task updateTask(Long id, Task updated, String userEmail) {

        Task task = getTask(id);
        if (!task.getCreatedBy().getEmail().equals(userEmail) &&
                (task.getAssignedTo() == null ||
                        !task.getAssignedTo().getEmail().equals(userEmail))) {

            throw new RuntimeException("Not authorized");
        }

        task.setTitle(updated.getTitle());
        task.setDescription(updated.getDescription());
        task.setStatus(updated.getStatus());

        return taskRepo.save(task);
    }

    public void deleteTask(Long id, String userEmail) {
        Task task = getTask(id);

        if (!task.getCreatedBy().getEmail().equals(userEmail)) {
            throw new RuntimeException("Not authorized to delete");
        }

        taskRepo.deleteById(id);
    }

    public List<Task> filterByStatus(TaskStatus status) {
        return taskRepo.findByStatus(status);
    }

    public List<Task> filterByUser(Long userId) {
        return taskRepo.findByAssignedToId(userId);
    }
}