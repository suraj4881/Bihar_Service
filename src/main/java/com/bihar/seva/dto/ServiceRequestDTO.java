package com.bihar.seva.dto;

import lombok.Data;
import javax.validation.constraints.NotBlank;
import javax.validation.constraints.Positive;
import java.util.List;

@Data
public class ServiceRequestDTO {
    @NotBlank(message = "Service name is required")
    private String name;
    
    @NotBlank(message = "Category is required")
    private String category;
    
    private String subcategory;
    private String description;
    private String icon;
    private String image;
    
    @Positive(message = "Base price must be positive")
    private double basePrice;
    
    private String priceUnit;
    private String duration;
    private List<String> tags;
    private List<String> requirements;
    private List<String> benefits;
    private boolean isCustom = false;
    private String toolsRequired;
    private String skillsRequired;
    private String experienceLevel;
    private String workingHours;
    private String serviceAreas;
    private List<PriceTierDTO> priceTiers;
    
    @Data
    public static class PriceTierDTO {
        private String name;
        private double price;
        private String description;
        private List<String> includes;
    }
}
