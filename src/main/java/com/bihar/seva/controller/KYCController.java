package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.KYCDocument;
import com.bihar.seva.service.KYCService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/kyc")
@CrossOrigin(origins = "*")
public class KYCController {
    
    private static final Logger logger = LoggerFactory.getLogger(KYCController.class);
    
    @Autowired
    private KYCService kycService;
    
    /**
     * Submit KYC documents
     */
    @PostMapping("/submit")
    public ResponseEntity<ApiResponse<KYCDocument>> submitKYC(
            @RequestParam("userId") String userId,
            @RequestParam("userRole") String userRole,
            @RequestParam("documentType") String documentType,
            @RequestParam("documentNumber") String documentNumber,
            @RequestParam("documentFront") MultipartFile documentFront,
            @RequestParam(value = "documentBack", required = false) MultipartFile documentBack,
            @RequestParam("selfie") MultipartFile selfie,
            @RequestParam(value = "certificate", required = false) MultipartFile certificate,
            @RequestParam(value = "experienceProof", required = false) MultipartFile experienceProof
    ) {
        try {
            logger.info("KYC submission started for userId: {}, role: {}", userId, userRole);
            
            KYCDocument kycData = new KYCDocument();
            kycData.setUserId(userId);
            kycData.setUserRole(userRole);
            kycData.setDocumentType(documentType);
            kycData.setDocumentNumber(documentNumber);
            
            KYCDocument savedKYC = kycService.submitKYC(
                kycData, 
                documentFront, 
                documentBack, 
                selfie, 
                certificate, 
                experienceProof
            );
            
            logger.info("KYC submitted successfully for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "KYC submitted successfully", savedKYC));
            
        } catch (Exception e) {
            logger.error("KYC submission failed for userId: {}", userId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "KYC submission failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get KYC status for user
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<ApiResponse<KYCDocument>> getKYCStatus(@PathVariable String userId) {
        logger.info("Fetching KYC status for userId: {}", userId);
        
        Optional<KYCDocument> kyc = kycService.getKYCByUserId(userId);
        
        if (kyc.isPresent()) {
            logger.info("KYC found for userId: {}, status: {}", userId, kyc.get().getStatus());
            return ResponseEntity.ok(new ApiResponse<>(true, "KYC status found", kyc.get()));
        } else {
            logger.warn("No KYC found for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(false, "No KYC submitted yet", null));
        }
    }
    
    /**
     * Get all pending KYC documents (Admin only)
     */
    @GetMapping("/pending")
    public ResponseEntity<ApiResponse<List<KYCDocument>>> getPendingKYCs() {
        logger.info("Fetching all pending KYC documents");
        
        try {
            List<KYCDocument> pendingKYCs = kycService.getPendingKYCs();
            logger.info("Found {} pending KYC documents", pendingKYCs.size());
            
            return ResponseEntity.ok(new ApiResponse<>(true, "Pending KYCs retrieved", pendingKYCs));
        } catch (Exception e) {
            logger.error("Error fetching pending KYCs", e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Error fetching pending KYCs: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Verify or reject KYC (Admin only)
     */
    @PostMapping("/verify/{kycId}")
    public ResponseEntity<ApiResponse<KYCDocument>> verifyKYC(
            @PathVariable String kycId,
            @RequestParam String adminId,
            @RequestParam boolean approve,
            @RequestParam(required = false) String rejectionReason
    ) {
        try {
            logger.info("KYC verification started - kycId: {}, approve: {}, adminId: {}", 
                       kycId, approve, adminId);
            
            KYCDocument verifiedKYC = kycService.verifyKYC(kycId, adminId, approve, rejectionReason);
            
            logger.info("KYC verification completed - kycId: {}, status: {}", 
                       kycId, verifiedKYC.getStatus());
            
            String message = approve ? "KYC approved successfully" : "KYC rejected";
            return ResponseEntity.ok(new ApiResponse<>(true, message, verifiedKYC));
            
        } catch (Exception e) {
            logger.error("KYC verification failed for kycId: {}", kycId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "KYC verification failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Check if user is verified
     */
    @GetMapping("/verified/{userId}")
    public ResponseEntity<ApiResponse<Boolean>> isUserVerified(@PathVariable String userId) {
        logger.info("Checking verification status for userId: {}", userId);
        
        boolean isVerified = kycService.isUserVerified(userId);
        logger.info("User {} verification status: {}", userId, isVerified);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Verification status", isVerified));
    }
    
    /**
     * Get pending KYC count
     */
    @GetMapping("/stats/pending-count")
    public ResponseEntity<ApiResponse<Long>> getPendingKYCCount() {
        logger.info("Fetching pending KYC count");
        
        long count = kycService.getPendingKYCCount();
        logger.info("Pending KYC count: {}", count);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending KYC count", count));
    }
}
