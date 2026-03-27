package com.capstone.taskmanager.repository;

import com.capstone.taskmanager.model.Task;
import com.capstone.taskmanager.model.TaskStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TaskRepository extends JpaRepository<Task, Long> {

    List<Task> findByStatus(TaskStatus status);

    List<Task> findByAssignedToId(Long userId);
}