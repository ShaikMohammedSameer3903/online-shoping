package com.ourstore.ourstorebackend.controllers;

import com.ourstore.ourstorebackend.entities.Product;
import com.ourstore.ourstorebackend.repositories.ProductRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Random;

@RestController
@RequestMapping("/api/products")
@CrossOrigin(origins = "http://localhost:5173")
public class ProductController {

    @Autowired
    private ProductRepository productRepository;

    @GetMapping
    public List<Product> getAllProducts() {
        return productRepository.findAll();
    }

    @PostMapping
    public Product addProduct(@RequestBody Product product) {
        return productRepository.save(product);
    }
    
    @PostMapping("/add-dummy-data")
    public String addDummyData() {
        if (productRepository.count() == 0) {
            Random random = new Random();
            for (int i = 1; i <= 10; i++) {
                Product product = new Product();
                product.setName("Product " + i);
                product.setDescription("A great description for product " + i + ".");
                product.setPrice(random.nextDouble() * 100 + 10);
                productRepository.save(product);
            }
            return "Dummy data added successfully.";
        }
        return "Products already exist, no dummy data added.";
    }
}