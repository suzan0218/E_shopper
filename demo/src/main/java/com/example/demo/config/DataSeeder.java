package com.example.demo.config;

import com.example.demo.model.AppUser;
import com.example.demo.model.Category;
import com.example.demo.model.Product;
import com.example.demo.repository.AppUserRepository;
import com.example.demo.repository.CategoryRepository;
import com.example.demo.repository.ProductRepository;
import java.math.BigDecimal;
import java.util.List;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    CommandLineRunner seedData(
        CategoryRepository categoryRepository,
        ProductRepository productRepository,
        AppUserRepository appUserRepository,
        PasswordEncoder passwordEncoder
    ) {
        return args -> {
            if (!appUserRepository.existsByEmailIgnoreCase("admin@eshopper.com")) {
                AppUser admin = new AppUser();
                admin.setName("System Admin");
                admin.setEmail("admin@eshopper.com");
                admin.setPasswordHash(passwordEncoder.encode("admin123"));
                admin.setRole("ADMIN");
                appUserRepository.save(admin);
            }

            if (categoryRepository.count() > 0 || productRepository.count() > 0) {
                return;
            }

            Category shirts = categoryRepository.save(new Category("Shirts", "Casual and formal shirts"));
            Category dresses = categoryRepository.save(new Category("Dresses", "All kinds of dresses"));
            Category shoes = categoryRepository.save(new Category("Shoes", "Footwear collection"));
            Category jackets = categoryRepository.save(new Category("Jackets", "Warm and stylish jackets"));

            productRepository.saveAll(List.of(
                product("Colorful Stylish Shirt", "Soft cotton shirt for daily wear", "img/product-1.jpg", "123.00", "150.00", 4.3, 50, 40, shirts),
                product("Classic White Shirt", "Formal shirt with slim fit", "img/product-2.jpg", "99.00", "129.00", 4.1, 38, 35, shirts),
                product("Summer Floral Dress", "Lightweight dress for summer", "img/product-3.jpg", "149.00", "199.00", 4.6, 64, 24, dresses),
                product("Evening Party Dress", "Elegant evening wear", "img/product-4.jpg", "199.00", "249.00", 4.5, 45, 15, dresses),
                product("Running Shoes", "Comfortable shoes with grip sole", "img/product-5.jpg", "139.00", "179.00", 4.4, 89, 50, shoes),
                product("Leather Sneakers", "Premium sneakers for daily use", "img/product-6.jpg", "179.00", "229.00", 4.2, 33, 28, shoes),
                product("Denim Jacket", "Classic denim jacket", "img/product-7.jpg", "169.00", "219.00", 4.1, 26, 22, jackets),
                product("Winter Puffer Jacket", "Insulated winter jacket", "img/product-8.jpg", "229.00", "299.00", 4.7, 71, 12, jackets)
            ));
        };
    }

    private Product product(
        String name,
        String description,
        String imageUrl,
        String price,
        String originalPrice,
        double rating,
        int reviewCount,
        int stock,
        Category category
    ) {
        Product product = new Product();
        product.setName(name);
        product.setDescription(description);
        product.setImageUrl(imageUrl);
        product.setPrice(new BigDecimal(price));
        product.setOriginalPrice(new BigDecimal(originalPrice));
        product.setRating(rating);
        product.setReviewCount(reviewCount);
        product.setStock(stock);
        product.setActive(true);
        product.setCategory(category);
        return product;
    }
}
