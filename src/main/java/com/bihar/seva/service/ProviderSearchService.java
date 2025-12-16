package com.bihar.seva.service;

import com.bihar.seva.model.Provider;
import com.bihar.seva.repositories.ProviderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ProviderSearchService {
    
    private final ProviderRepository providerRepository;
    
    public List<Provider> searchProviders(Map<String, Object> filters) {
        List<Provider> providers = providerRepository.findAll();
        
        // Apply filters
        String skill = (String) filters.get("skill");
        String city = (String) filters.get("city");
        Boolean verified = (Boolean) filters.get("verified");
        Double minRating = (Double) filters.get("minRating");
        Double maxPrice = (Double) filters.get("maxPrice");
        Double minPrice = (Double) filters.get("minPrice");
        String sortBy = (String) filters.get("sortBy");
        
        // Filter by skill
        if (skill != null && !skill.isEmpty()) {
            providers = providers.stream()
                .filter(p -> p.getSkill() != null && 
                    p.getSkill().toLowerCase().contains(skill.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        // Filter by city
        if (city != null && !city.isEmpty()) {
            providers = providers.stream()
                .filter(p -> p.getCity() != null && 
                    p.getCity().equalsIgnoreCase(city))
                .collect(Collectors.toList());
        }
        
        // Filter by verified status
        if (verified != null && verified) {
            providers = providers.stream()
                .filter(Provider::isVerified)
                .collect(Collectors.toList());
        }
        
        // Filter by minimum rating
        if (minRating != null && minRating > 0) {
            providers = providers.stream()
                .filter(p -> p.getRating() >= minRating)
                .collect(Collectors.toList());
        }
        
        // Filter by price range
        if (minPrice != null && minPrice > 0) {
            providers = providers.stream()
                .filter(p -> p.getPrice() >= minPrice)
                .collect(Collectors.toList());
        }
        
        if (maxPrice != null && maxPrice < Double.MAX_VALUE) {
            providers = providers.stream()
                .filter(p -> p.getPrice() <= maxPrice)
                .collect(Collectors.toList());
        }
        
        // Filter only active providers
        providers = providers.stream()
            .filter(Provider::isActive)
            .collect(Collectors.toList());
        
        // Sort results
        if ("rating".equals(sortBy)) {
            providers.sort(Comparator.comparingDouble(Provider::getRating).reversed());
        } else if ("price_low".equals(sortBy)) {
            providers.sort(Comparator.comparingDouble(Provider::getPrice));
        } else if ("price_high".equals(sortBy)) {
            providers.sort(Comparator.comparingDouble(Provider::getPrice).reversed());
        } else if ("bookings".equals(sortBy)) {
            providers.sort(Comparator.comparingInt(Provider::getTotalBookings).reversed());
        } else {
            // Default: verified first, then by rating
            providers.sort((p1, p2) -> {
                if (p1.isVerified() != p2.isVerified()) {
                    return p1.isVerified() ? -1 : 1;
                }
                return Double.compare(p2.getRating(), p1.getRating());
            });
        }
        
        log.info("Search completed. Found {} providers", providers.size());
        return providers;
    }
    
    public List<Provider> getProvidersByCategory(String category) {
        return providerRepository.findBySkillContainingIgnoreCase(category).stream()
            .filter(Provider::isActive)
            .sorted((p1, p2) -> {
                if (p1.isVerified() != p2.isVerified()) {
                    return p1.isVerified() ? -1 : 1;
                }
                return Double.compare(p2.getRating(), p1.getRating());
            })
            .collect(Collectors.toList());
    }
    
    public List<Provider> getTopRatedProviders(int limit) {
        return providerRepository.findAll().stream()
            .filter(Provider::isActive)
            .filter(Provider::isVerified)
            .filter(p -> p.getRating() >= 4.0)
            .sorted(Comparator.comparingDouble(Provider::getRating).reversed())
            .limit(limit)
            .collect(Collectors.toList());
    }
    
    public List<Provider> getNearbyProviders(String city, String skill) {
        List<Provider> providers = providerRepository.findByCity(city).stream()
            .filter(Provider::isActive)
            .collect(Collectors.toList());
        
        if (skill != null && !skill.isEmpty()) {
            providers = providers.stream()
                .filter(p -> p.getSkill() != null && 
                    p.getSkill().toLowerCase().contains(skill.toLowerCase()))
                .collect(Collectors.toList());
        }
        
        // Sort: verified first, then by rating
        providers.sort((p1, p2) -> {
            if (p1.isVerified() != p2.isVerified()) {
                return p1.isVerified() ? -1 : 1;
            }
            return Double.compare(p2.getRating(), p1.getRating());
        });
        
        return providers;
    }
    
    public List<Provider> getRecommendedProviders(String userId) {
        // For now, return top rated verified providers
        // Can be enhanced with ML-based recommendations based on user history
        return providerRepository.findAll().stream()
            .filter(Provider::isActive)
            .filter(Provider::isVerified)
            .filter(p -> p.getRating() >= 4.0)
            .sorted((p1, p2) -> {
                // Sort by rating and total bookings
                int ratingCompare = Double.compare(p2.getRating(), p1.getRating());
                if (ratingCompare != 0) return ratingCompare;
                return Integer.compare(p2.getTotalBookings(), p1.getTotalBookings());
            })
            .limit(10)
            .collect(Collectors.toList());
    }
}

