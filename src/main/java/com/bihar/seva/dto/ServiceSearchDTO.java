package com.bihar.seva.dto;

import lombok.Data;
import java.util.List;

@Data
public class ServiceSearchDTO {
    private String query;
    private String category;
    private String subcategory;
    private String city;
    private String pincode;
    private Double minPrice;
    private Double maxPrice;
    private String sortBy; // price, rating, popularity, distance
    private String sortOrder; // asc, desc
    private List<String> tags;
    private boolean isActive = true;
    private boolean isPopular = false;
    private int page = 0;
    private int size = 20;
}
