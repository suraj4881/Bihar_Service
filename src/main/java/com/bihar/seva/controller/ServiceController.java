package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.dto.ServiceRequestDTO;
import com.bihar.seva.dto.ServiceSearchDTO;
import com.bihar.seva.model.Service;
import com.bihar.seva.service.ServiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.validation.Valid;
import java.util.List;

@RestController
@RequestMapping("/api/services")
@CrossOrigin(origins = "*")
public class ServiceController {
    
    @Autowired
    private ServiceService serviceService;
    
    @PostMapping
    public ResponseEntity<ApiResponse<Service>> createService(@Valid @RequestBody ServiceRequestDTO serviceRequest) {
        try {
            // For now, using dummy user ID. In real app, get from JWT token
            String createdBy = "system";
            Service service = serviceService.createService(serviceRequest, createdBy);
            return ResponseEntity.ok(ApiResponse.success(service, "Service created successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping
    public ResponseEntity<ApiResponse<Page<Service>>> searchServices(@RequestParam(required = false) String query,
                                                                     @RequestParam(required = false) String category,
                                                                     @RequestParam(required = false) String subcategory,
                                                                     @RequestParam(required = false) String city,
                                                                     @RequestParam(required = false) String pincode,
                                                                     @RequestParam(required = false) Double minPrice,
                                                                     @RequestParam(required = false) Double maxPrice,
                                                                     @RequestParam(required = false) String sortBy,
                                                                     @RequestParam(required = false) String sortOrder,
                                                                     @RequestParam(required = false) List<String> tags,
                                                                     @RequestParam(defaultValue = "true") boolean isActive,
                                                                     @RequestParam(defaultValue = "false") boolean isPopular,
                                                                     @RequestParam(defaultValue = "0") int page,
                                                                     @RequestParam(defaultValue = "20") int size) {
        try {
            ServiceSearchDTO searchDTO = new ServiceSearchDTO();
            searchDTO.setQuery(query);
            searchDTO.setCategory(category);
            searchDTO.setSubcategory(subcategory);
            searchDTO.setCity(city);
            searchDTO.setPincode(pincode);
            searchDTO.setMinPrice(minPrice);
            searchDTO.setMaxPrice(maxPrice);
            searchDTO.setSortBy(sortBy);
            searchDTO.setSortOrder(sortOrder);
            searchDTO.setTags(tags);
            searchDTO.setActive(isActive);
            searchDTO.setPopular(isPopular);
            searchDTO.setPage(page);
            searchDTO.setSize(size);
            
            Page<Service> services = serviceService.searchServices(searchDTO);
            return ResponseEntity.ok(ApiResponse.success(services, "Services retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/all")
    public ResponseEntity<ApiResponse<List<Service>>> getAllServices() {
        try {
            List<Service> services = serviceService.getAllServices();
            return ResponseEntity.ok(ApiResponse.success(services, "All services retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/category/{category}")
    public ResponseEntity<ApiResponse<List<Service>>> getServicesByCategory(@PathVariable String category) {
        try {
            List<Service> services = serviceService.getServicesByCategory(category);
            return ResponseEntity.ok(ApiResponse.success(services, "Services by category retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/popular")
    public ResponseEntity<ApiResponse<List<Service>>> getPopularServices() {
        try {
            List<Service> services = serviceService.getPopularServices();
            return ResponseEntity.ok(ApiResponse.success(services, "Popular services retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/custom/{createdBy}")
    public ResponseEntity<ApiResponse<List<Service>>> getCustomServices(@PathVariable String createdBy) {
        try {
            List<Service> services = serviceService.getCustomServices(createdBy);
            return ResponseEntity.ok(ApiResponse.success(services, "Custom services retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Service>> getServiceById(@PathVariable String id) {
        try {
            Service service = serviceService.getServiceById(id);
            return ResponseEntity.ok(ApiResponse.success(service, "Service retrieved successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<Service>> updateService(@PathVariable String id, @Valid @RequestBody ServiceRequestDTO serviceRequest) {
        try {
            Service service = serviceService.updateService(id, serviceRequest);
            return ResponseEntity.ok(ApiResponse.success(service, "Service updated successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<String>> deleteService(@PathVariable String id) {
        try {
            serviceService.deleteService(id);
            return ResponseEntity.ok(ApiResponse.success("Service deleted successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{id}/increment-booking")
    public ResponseEntity<ApiResponse<String>> incrementBookingCount(@PathVariable String id) {
        try {
            serviceService.incrementBookingCount(id);
            return ResponseEntity.ok(ApiResponse.success("Booking count incremented successfully"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(ApiResponse.error(e.getMessage()));
        }
    }
}
