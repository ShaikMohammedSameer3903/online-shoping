package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.User;
import com.ourstore.ourstorebackend.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/register")
    public Map<String, String> registerUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        User existingUser = userRepository.findByUsername(user.getUsername());
        if (existingUser != null) {
            response.put("message", "User already exists.");
            return response;
        }
        userRepository.save(user);
        response.put("message", "Registration successful!");
        return response;
    }

    @PostMapping("/login")
    public Map<String, String> loginUser(@RequestBody User user) {
        Map<String, String> response = new HashMap<>();
        User foundUser = userRepository.findByUsernameAndPassword(user.getUsername(), user.getPassword());
        if (foundUser != null) {
            response.put("message", "Login successful!");
            response.put("userId", foundUser.getId().toString());
            return response;
        }
        response.put("message", "Invalid credentials.");
        return response;
    }
}