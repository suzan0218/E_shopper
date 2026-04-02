package com.example.demo.service;

import com.example.demo.model.Product;
import com.example.demo.repository.ProductRepository;
import java.math.BigDecimal;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
public class ProductService {

    private final ProductRepository productRepository;

    public ProductService(ProductRepository productRepository) {
        this.productRepository = productRepository;
    }

    public Page<Product> findProducts(
        String search,
        Long categoryId,
        BigDecimal minPrice,
        BigDecimal maxPrice,
        Pageable pageable
    ) {
        Specification<Product> specification = Specification.where(isActive());

        if (StringUtils.hasText(search)) {
            specification = specification.and(nameContains(search));
        }
        if (categoryId != null) {
            specification = specification.and(hasCategory(categoryId));
        }
        if (minPrice != null) {
            specification = specification.and(priceGreaterThanOrEqual(minPrice));
        }
        if (maxPrice != null) {
            specification = specification.and(priceLessThanOrEqual(maxPrice));
        }

        return productRepository.findAll(specification, pageable);
    }

    private Specification<Product> isActive() {
        return (root, query, cb) -> cb.isTrue(root.get("active"));
    }

    private Specification<Product> nameContains(String search) {
        return (root, query, cb) -> cb.like(cb.lower(root.get("name")), "%" + search.toLowerCase() + "%");
    }

    private Specification<Product> hasCategory(Long categoryId) {
        return (root, query, cb) -> cb.equal(root.get("category").get("id"), categoryId);
    }

    private Specification<Product> priceGreaterThanOrEqual(BigDecimal minPrice) {
        return (root, query, cb) -> cb.greaterThanOrEqualTo(root.get("price"), minPrice);
    }

    private Specification<Product> priceLessThanOrEqual(BigDecimal maxPrice) {
        return (root, query, cb) -> cb.lessThanOrEqualTo(root.get("price"), maxPrice);
    }
}
