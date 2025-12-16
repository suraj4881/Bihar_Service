package com.bihar.seva.service;

import com.bihar.seva.dto.ServiceRequestDTO;
import com.bihar.seva.dto.ServiceSearchDTO;
import com.bihar.seva.exception.ResourceNotFoundException;
import com.bihar.seva.exception.ValidationException;
import com.bihar.seva.model.Service;
import com.bihar.seva.repositories.ServiceRepository;
import com.bihar.seva.util.LoggingUtil;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@org.springframework.stereotype.Service
public class ServiceService {
    
    private static final Logger logger = LoggerFactory.getLogger(ServiceService.class);
    
    @Autowired
    private ServiceRepository serviceRepository;
    
    public Service createService(ServiceRequestDTO serviceRequest, String createdBy) {
        LoggingUtil.logMethodEntry(logger, "createService", serviceRequest.getName());
        
        try {
            validateServiceRequest(serviceRequest);
            
            // Check if service already exists
            Optional<Service> existingService = serviceRepository.findByNameAndIsActiveTrue(serviceRequest.getName());
            if (existingService.isPresent()) {
                LoggingUtil.logWarning(logger, "createService", "Service with name already exists", serviceRequest.getName());
                throw new ValidationException("Service with this name already exists");
            }
            
            Service service = new Service();
            service.setName(serviceRequest.getName());
            service.setCategory(serviceRequest.getCategory());
            service.setSubcategory(serviceRequest.getSubcategory());
            service.setDescription(serviceRequest.getDescription());
            service.setIcon(serviceRequest.getIcon());
            service.setImage(serviceRequest.getImage());
            service.setBasePrice(serviceRequest.getBasePrice());
            service.setPriceUnit(serviceRequest.getPriceUnit());
            service.setDuration(serviceRequest.getDuration());
            service.setTags(serviceRequest.getTags());
            service.setRequirements(serviceRequest.getRequirements());
            service.setBenefits(serviceRequest.getBenefits());
            service.setCustom(serviceRequest.isCustom());
            service.setToolsRequired(serviceRequest.getToolsRequired());
            service.setSkillsRequired(serviceRequest.getSkillsRequired());
            service.setExperienceLevel(serviceRequest.getExperienceLevel());
            service.setWorkingHours(serviceRequest.getWorkingHours());
            service.setServiceAreas(serviceRequest.getServiceAreas());
            service.setCreatedBy(createdBy);
            service.setCreatedAt(LocalDateTime.now());
            service.setUpdatedAt(LocalDateTime.now());
            
            // Convert price tiers
            if (serviceRequest.getPriceTiers() != null) {
                List<Service.PriceTier> priceTiers = serviceRequest.getPriceTiers().stream()
                    .map(tier -> {
                        Service.PriceTier priceTier = new Service.PriceTier();
                        priceTier.setName(tier.getName());
                        priceTier.setPrice(tier.getPrice());
                        priceTier.setDescription(tier.getDescription());
                        priceTier.setIncludes(tier.getIncludes());
                        return priceTier;
                    })
                    .toList();
                service.setPriceTiers(priceTiers);
            }
            
            Service savedService = serviceRepository.save(service);
            LoggingUtil.logDatabaseOperation(logger, "CREATE", "services", savedService.getId(), "SUCCESS");
            LoggingUtil.logMethodExit(logger, "createService", "Service created successfully");
            
            return savedService;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "createService", ex, serviceRequest.getName());
            throw ex;
        }
    }
    
    public List<Service> getAllServices() {
        LoggingUtil.logMethodEntry(logger, "getAllServices");
        
        try {
            List<Service> services = serviceRepository.findByIsActiveTrue();
            LoggingUtil.logDatabaseOperation(logger, "FIND_ALL", "services", "ALL", "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getAllServices", "Retrieved " + services.size() + " services");
            
            return services;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getAllServices", ex);
            throw ex;
        }
    }
    
    public Page<Service> searchServices(ServiceSearchDTO searchDTO) {
        LoggingUtil.logMethodEntry(logger, "searchServices", searchDTO.getQuery());
        
        try {
            Pageable pageable = createPageable(searchDTO);
            
            Page<Service> services;
            
            if (StringUtils.hasText(searchDTO.getQuery())) {
                services = serviceRepository.searchServices(searchDTO.getQuery(), pageable);
            } else if (StringUtils.hasText(searchDTO.getCategory())) {
                services = serviceRepository.findByCategoryAndIsActiveTrue(searchDTO.getCategory(), pageable);
            } else {
                services = serviceRepository.findByIsActiveTrue(pageable);
            }
            
            LoggingUtil.logDatabaseOperation(logger, "SEARCH", "services", searchDTO.getQuery(), "SUCCESS");
            LoggingUtil.logMethodExit(logger, "searchServices", "Found " + services.getTotalElements() + " services");
            
            return services;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "searchServices", ex, searchDTO.getQuery());
            throw ex;
        }
    }
    
    public List<Service> getServicesByCategory(String category) {
        LoggingUtil.logMethodEntry(logger, "getServicesByCategory", category);
        
        try {
            if (!StringUtils.hasText(category)) {
                throw new ValidationException("Category cannot be null or empty");
            }
            
            List<Service> services = serviceRepository.findByCategoryAndIsActiveTrue(category);
            LoggingUtil.logDatabaseOperation(logger, "FIND_BY_CATEGORY", "services", category, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getServicesByCategory", "Retrieved " + services.size() + " services");
            
            return services;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getServicesByCategory", ex, category);
            throw ex;
        }
    }
    
    public List<Service> getPopularServices() {
        LoggingUtil.logMethodEntry(logger, "getPopularServices");
        
        try {
            List<Service> services = serviceRepository.findByIsPopularTrueAndIsActiveTrueOrderByBookingCountDesc();
            LoggingUtil.logDatabaseOperation(logger, "FIND_POPULAR", "services", "POPULAR", "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getPopularServices", "Retrieved " + services.size() + " popular services");
            
            return services;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getPopularServices", ex);
            throw ex;
        }
    }
    
    public List<Service> getCustomServices(String createdBy) {
        LoggingUtil.logMethodEntry(logger, "getCustomServices", createdBy);
        
        try {
            if (!StringUtils.hasText(createdBy)) {
                throw new ValidationException("Created by cannot be null or empty");
            }
            
            List<Service> services = serviceRepository.findByCreatedByAndIsActiveTrue(createdBy);
            LoggingUtil.logDatabaseOperation(logger, "FIND_CUSTOM", "services", createdBy, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getCustomServices", "Retrieved " + services.size() + " custom services");
            
            return services;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getCustomServices", ex, createdBy);
            throw ex;
        }
    }
    
    public Service getServiceById(String id) {
        LoggingUtil.logMethodEntry(logger, "getServiceById", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("Service ID cannot be null or empty");
            }
            
            Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
            
            if (!service.isActive()) {
                throw new ResourceNotFoundException("Service is not active");
            }
            
            LoggingUtil.logDatabaseOperation(logger, "FIND_BY_ID", "services", id, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "getServiceById", "Service found");
            
            return service;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "getServiceById", ex, id);
            throw ex;
        }
    }
    
    public Service updateService(String id, ServiceRequestDTO serviceRequest) {
        LoggingUtil.logMethodEntry(logger, "updateService", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("Service ID cannot be null or empty");
            }
            
            validateServiceRequest(serviceRequest);
            
            Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
            
            service.setName(serviceRequest.getName());
            service.setCategory(serviceRequest.getCategory());
            service.setSubcategory(serviceRequest.getSubcategory());
            service.setDescription(serviceRequest.getDescription());
            service.setIcon(serviceRequest.getIcon());
            service.setImage(serviceRequest.getImage());
            service.setBasePrice(serviceRequest.getBasePrice());
            service.setPriceUnit(serviceRequest.getPriceUnit());
            service.setDuration(serviceRequest.getDuration());
            service.setTags(serviceRequest.getTags());
            service.setRequirements(serviceRequest.getRequirements());
            service.setBenefits(serviceRequest.getBenefits());
            service.setToolsRequired(serviceRequest.getToolsRequired());
            service.setSkillsRequired(serviceRequest.getSkillsRequired());
            service.setExperienceLevel(serviceRequest.getExperienceLevel());
            service.setWorkingHours(serviceRequest.getWorkingHours());
            service.setServiceAreas(serviceRequest.getServiceAreas());
            service.setUpdatedAt(LocalDateTime.now());
            
            Service updatedService = serviceRepository.save(service);
            LoggingUtil.logDatabaseOperation(logger, "UPDATE", "services", id, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "updateService", "Service updated successfully");
            
            return updatedService;
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "updateService", ex, id);
            throw ex;
        }
    }
    
    public void deleteService(String id) {
        LoggingUtil.logMethodEntry(logger, "deleteService", id);
        
        try {
            if (!StringUtils.hasText(id)) {
                throw new ValidationException("Service ID cannot be null or empty");
            }
            
            Service service = serviceRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + id));
            
            service.setActive(false);
            service.setUpdatedAt(LocalDateTime.now());
            
            serviceRepository.save(service);
            LoggingUtil.logDatabaseOperation(logger, "DELETE", "services", id, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "deleteService", "Service deleted successfully");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "deleteService", ex, id);
            throw ex;
        }
    }
    
    public void incrementBookingCount(String serviceId) {
        LoggingUtil.logMethodEntry(logger, "incrementBookingCount", serviceId);
        
        try {
            Service service = serviceRepository.findById(serviceId)
                .orElseThrow(() -> new ResourceNotFoundException("Service not found with ID: " + serviceId));
            
            service.setBookingCount(service.getBookingCount() + 1);
            service.setUpdatedAt(LocalDateTime.now());
            
            serviceRepository.save(service);
            LoggingUtil.logDatabaseOperation(logger, "INCREMENT_BOOKING", "services", serviceId, "SUCCESS");
            LoggingUtil.logMethodExit(logger, "incrementBookingCount", "Booking count incremented");
        } catch (Exception ex) {
            LoggingUtil.logError(logger, "incrementBookingCount", ex, serviceId);
            throw ex;
        }
    }
    
    private void validateServiceRequest(ServiceRequestDTO serviceRequest) {
        if (serviceRequest == null) {
            throw new ValidationException("Service request cannot be null");
        }
        
        if (!StringUtils.hasText(serviceRequest.getName())) {
            throw new ValidationException("Service name is required");
        }
        
        if (!StringUtils.hasText(serviceRequest.getCategory())) {
            throw new ValidationException("Category is required");
        }
        
        if (serviceRequest.getBasePrice() <= 0) {
            throw new ValidationException("Base price must be greater than 0");
        }
    }
    
    private Pageable createPageable(ServiceSearchDTO searchDTO) {
        Sort sort = Sort.by(Sort.Direction.ASC, "sortOrder");
        
        if (StringUtils.hasText(searchDTO.getSortBy())) {
            Sort.Direction direction = StringUtils.hasText(searchDTO.getSortOrder()) && 
                searchDTO.getSortOrder().equalsIgnoreCase("desc") ? 
                Sort.Direction.DESC : Sort.Direction.ASC;
            
            switch (searchDTO.getSortBy().toLowerCase()) {
                case "price":
                    sort = Sort.by(direction, "basePrice");
                    break;
                case "rating":
                    sort = Sort.by(direction, "averageRating");
                    break;
                case "popularity":
                    sort = Sort.by(direction, "bookingCount");
                    break;
                case "name":
                    sort = Sort.by(direction, "name");
                    break;
                default:
                    sort = Sort.by(Sort.Direction.ASC, "sortOrder");
            }
        }
        
        return PageRequest.of(searchDTO.getPage(), searchDTO.getSize(), sort);
    }
}
