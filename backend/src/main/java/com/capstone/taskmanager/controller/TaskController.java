package com.capstone.taskmanager.controller;

import com.capstone.taskmanager.model.*;
import com.capstone.taskmanager.service.TaskService;
import java.security.Principal;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskService taskService;

    public TaskController(TaskService taskService) {
        this.taskService = taskService;
    }

    @PostMapping
    public Task createTask(@RequestBody Task task,
                           Authentication auth) {
        String email = auth.getName();
        return taskService.createTask(task, email);
    }

    @GetMapping
    public List<Task> getTasks() {
        return taskService.getAllTasks();
    }

    @GetMapping("/{id}")
    public Task getTask(@PathVariable Long id) {
        return taskService.getTask(id);
    }

    @PutMapping("/{id}")
    public Task updateTask(@PathVariable Long id,
                           @RequestBody Task task,
                           Principal principal) {

        return taskService.updateTask(id, task, principal.getName());
    }

    @DeleteMapping("/{id}")
    public String deleteTask(@PathVariable Long id, Principal principal) {
        taskService.deleteTask(id, principal.getName());
        return "Task deleted";
    }

    @GetMapping("/filter/status")
    public List<Task> getByStatus(@RequestParam TaskStatus status) {
        return taskService.filterByStatus(status);
    }

    @GetMapping("/filter/user")
    public List<Task> getByUser(@RequestParam Long userId) {
        return taskService.filterByUser(userId);
    }
}