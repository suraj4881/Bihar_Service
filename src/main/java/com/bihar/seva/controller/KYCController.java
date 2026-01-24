package com.bihar.seva.controller;

import com.bihar.seva.dto.ApiResponse;
import com.bihar.seva.model.AadhaarDocument;
import com.bihar.seva.model.PANDocument;
import com.bihar.seva.model.SelfieDocument;
// KYCDocument model removed - using separate collections (Aadhaar, PAN, Selfie)
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
    public ResponseEntity<ApiResponse<Object>> submitKYC(
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
            
            // Use separate document submission methods based on documentType
            Object savedDoc = null;
            if ("AADHAAR".equalsIgnoreCase(documentType)) {
                // For Aadhaar: userId, userRole, frontImage, backImage, aadhaarNumber, isOtpVerified
                savedDoc = kycService.submitAadhaar(userId, userRole, documentFront, documentBack, documentNumber, false);
            } else if ("PAN".equalsIgnoreCase(documentType)) {
                // For PAN: userId, userRole, panImage, panNumber
                savedDoc = kycService.submitPAN(userId, userRole, documentFront, documentNumber);
            } else {
                throw new RuntimeException("Invalid document type. Use AADHAAR or PAN");
            }
            
            logger.info("KYC submitted successfully for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "KYC submitted successfully", savedDoc));
            
        } catch (Exception e) {
            logger.error("KYC submission failed for userId: {}", userId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "KYC submission failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get KYC status for user - checks separate collections (Aadhaar, PAN, Selfie)
     */
    @GetMapping("/status/{userId}")
    public ResponseEntity<ApiResponse<com.bihar.seva.dto.KYCStatusResponse>> getKYCStatus(@PathVariable String userId) {
        logger.info("=== KYC Status API Called - userId: {} ===", userId);
        
        try {
            logger.info("Calling getAggregatedKYCStatus for userId: {}", userId);
            com.bihar.seva.dto.KYCStatusResponse status = kycService.getAggregatedKYCStatus(userId);
            
            logger.info("KYC Status Response - Status: {}, Aadhaar: {}, PAN: {}, Selfie: {}", 
                       status.getStatus(), status.isAadhaarSubmitted(), status.isPanSubmitted(), status.isSelfieSubmitted());
            
            // Always return the status, even if null (means not submitted)
            logger.info("Returning success response with status data");
            return ResponseEntity.ok(new ApiResponse<>(true, "KYC status retrieved", status));
        } catch (Exception e) {
            logger.error("Error retrieving KYC status for userId: {}", userId, e);
            
            // Return error but still try to return a status object
            com.bihar.seva.dto.KYCStatusResponse errorStatus = new com.bihar.seva.dto.KYCStatusResponse();
            errorStatus.setStatus(null);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Error fetching KYC status: " + e.getMessage(), errorStatus)
            );
        }
    }
    
    /**
     * Get all pending KYC documents (Admin only)
     */
    // Old getPendingKYCs and verifyKYC methods removed
    // Use /api/admin/kyc/pending and individual document approve/reject endpoints
    
    /**
     * Check if user is verified
     */
    @GetMapping("/verified/{userId}")
    public ResponseEntity<ApiResponse<Boolean>> isUserVerified(@PathVariable String userId) {
        logger.info("Checking verification status for userId: {}", userId);
        
        // Check verification status from aggregated KYC status
        com.bihar.seva.dto.KYCStatusResponse kycStatus = kycService.getAggregatedKYCStatus(userId);
        boolean isVerified = kycStatus != null && "VERIFIED".equals(kycStatus.getStatus());
        logger.info("User {} verification status: {}", userId, isVerified);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Verification status", isVerified));
    }
    
    /**
     * Get pending KYC count
     */
    @GetMapping("/stats/pending-count")
    public ResponseEntity<ApiResponse<Long>> getPendingKYCCount() {
        logger.info("Fetching pending KYC count");
        
        // Get pending KYC count from pending requests
        List<com.bihar.seva.dto.PendingKYCRequest> pendingRequests = kycService.getPendingKYCRequests();
        long count = pendingRequests.size();
        logger.info("Pending KYC count: {}", count);
        
        return ResponseEntity.ok(new ApiResponse<>(true, "Pending KYC count", count));
    }
    
    /**
     * Submit Aadhaar documents to separate collection
     */
    @PostMapping("/aadhaar/submit")
    public ResponseEntity<ApiResponse<AadhaarDocument>> submitAadhaar(
            @RequestParam("userId") String userId,
            @RequestParam("userRole") String userRole,
            @RequestParam("aadhaarFront") MultipartFile aadhaarFront,
            @RequestParam("aadhaarBack") MultipartFile aadhaarBack,
            @RequestParam(value = "aadhaarNumber", required = false) String aadhaarNumber,
            @RequestParam(value = "isOtpVerified", defaultValue = "false") boolean isOtpVerified
    ) {
        try {
            logger.info("Aadhaar submission started for userId: {}", userId);
            
            AadhaarDocument saved = kycService.submitAadhaar(
                userId, 
                userRole, 
                aadhaarFront, 
                aadhaarBack,
                aadhaarNumber,
                isOtpVerified
            );
            
            logger.info("Aadhaar submitted successfully for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Aadhaar submitted successfully", saved));
            
        } catch (Exception e) {
            logger.error("Aadhaar submission failed for userId: {}", userId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Aadhaar submission failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Submit PAN document to separate collection
     */
    @PostMapping("/pan/submit")
    public ResponseEntity<ApiResponse<PANDocument>> submitPAN(
            @RequestParam("userId") String userId,
            @RequestParam("userRole") String userRole,
            @RequestParam("panImage") MultipartFile panImage,
            @RequestParam("panNumber") String panNumber
    ) {
        try {
            logger.info("PAN submission started for userId: {}", userId);
            
            PANDocument saved = kycService.submitPAN(userId, userRole, panImage, panNumber);
            
            logger.info("PAN submitted successfully for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "PAN submitted successfully", saved));
            
        } catch (Exception e) {
            logger.error("PAN submission failed for userId: {}", userId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "PAN submission failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Submit Selfie document to separate collection
     */
    @PostMapping("/selfie/submit")
    public ResponseEntity<ApiResponse<SelfieDocument>> submitSelfie(
            @RequestParam("userId") String userId,
            @RequestParam("userRole") String userRole,
            @RequestParam("selfieImage") MultipartFile selfieImage,
            @RequestParam(value = "captureMethod", defaultValue = "UPLOAD") String captureMethod
    ) {
        try {
            logger.info("Selfie submission started for userId: {}", userId);
            
            SelfieDocument saved = kycService.submitSelfie(userId, userRole, selfieImage, captureMethod);
            
            logger.info("Selfie submitted successfully for userId: {}", userId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Selfie submitted successfully", saved));
            
        } catch (Exception e) {
            logger.error("Selfie submission failed for userId: {}", userId, e);
            return ResponseEntity.badRequest().body(
                new ApiResponse<>(false, "Selfie submission failed: " + e.getMessage(), null)
            );
        }
    }
    
    /**
     * Get Aadhaar document by userId
     */
    @GetMapping("/aadhaar/{userId}")
    public ResponseEntity<ApiResponse<AadhaarDocument>> getAadhaar(@PathVariable String userId) {
        logger.info("Fetching Aadhaar for userId: {}", userId);
        
        Optional<AadhaarDocument> aadhaar = kycService.getAadhaarByUserId(userId);
        
        if (aadhaar.isPresent()) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Aadhaar found", aadhaar.get()));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(false, "No Aadhaar submitted yet", null));
        }
    }
    
    /**
     * Get PAN document by userId
     */
    @GetMapping("/pan/{userId}")
    public ResponseEntity<ApiResponse<PANDocument>> getPAN(@PathVariable String userId) {
        logger.info("Fetching PAN for userId: {}", userId);
        
        Optional<PANDocument> pan = kycService.getPANByUserId(userId);
        
        if (pan.isPresent()) {
            return ResponseEntity.ok(new ApiResponse<>(true, "PAN found", pan.get()));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(false, "No PAN submitted yet", null));
        }
    }
    
    /**
     * Get Selfie document by userId
     */
    @GetMapping("/selfie/{userId}")
    public ResponseEntity<ApiResponse<SelfieDocument>> getSelfie(@PathVariable String userId) {
        logger.info("Fetching Selfie for userId: {}", userId);
        
        Optional<SelfieDocument> selfie = kycService.getSelfieByUserId(userId);
        
        if (selfie.isPresent()) {
            return ResponseEntity.ok(new ApiResponse<>(true, "Selfie found", selfie.get()));
        } else {
            return ResponseEntity.ok(new ApiResponse<>(false, "No Selfie submitted yet", null));
        }
    }
    
    /**
     * Approve Aadhaar document (Admin only)
     */
    @PostMapping("/aadhaar/{documentId}/approve")
    public ResponseEntity<ApiResponse<AadhaarDocument>> approveAadhaar(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId
    ) {
        try {
            logger.info("Approving Aadhaar document: {} by admin: {}", documentId, adminUserId);
            AadhaarDocument approved = kycService.approveAadhaar(documentId, adminUserId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Aadhaar document approved", approved));
        } catch (Exception e) {
            logger.error("Error approving Aadhaar document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error approving Aadhaar: " + e.getMessage(), null));
        }
    }
    
    /**
     * Reject Aadhaar document (Admin only)
     */
    @PostMapping("/aadhaar/{documentId}/reject")
    public ResponseEntity<ApiResponse<AadhaarDocument>> rejectAadhaar(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId,
            @RequestParam("rejectionReason") String rejectionReason
    ) {
        try {
            logger.info("Rejecting Aadhaar document: {} by admin: {}", documentId, adminUserId);
            AadhaarDocument rejected = kycService.rejectAadhaar(documentId, adminUserId, rejectionReason);
            return ResponseEntity.ok(new ApiResponse<>(true, "Aadhaar document rejected", rejected));
        } catch (Exception e) {
            logger.error("Error rejecting Aadhaar document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error rejecting Aadhaar: " + e.getMessage(), null));
        }
    }
    
    /**
     * Approve PAN document (Admin only)
     */
    @PostMapping("/pan/{documentId}/approve")
    public ResponseEntity<ApiResponse<PANDocument>> approvePAN(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId
    ) {
        try {
            logger.info("Approving PAN document: {} by admin: {}", documentId, adminUserId);
            PANDocument approved = kycService.approvePAN(documentId, adminUserId);
            return ResponseEntity.ok(new ApiResponse<>(true, "PAN document approved", approved));
        } catch (Exception e) {
            logger.error("Error approving PAN document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error approving PAN: " + e.getMessage(), null));
        }
    }
    
    /**
     * Reject PAN document (Admin only)
     */
    @PostMapping("/pan/{documentId}/reject")
    public ResponseEntity<ApiResponse<PANDocument>> rejectPAN(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId,
            @RequestParam("rejectionReason") String rejectionReason
    ) {
        try {
            logger.info("Rejecting PAN document: {} by admin: {}", documentId, adminUserId);
            PANDocument rejected = kycService.rejectPAN(documentId, adminUserId, rejectionReason);
            return ResponseEntity.ok(new ApiResponse<>(true, "PAN document rejected", rejected));
        } catch (Exception e) {
            logger.error("Error rejecting PAN document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error rejecting PAN: " + e.getMessage(), null));
        }
    }
    
    /**
     * Approve Selfie document (Admin only)
     */
    @PostMapping("/selfie/{documentId}/approve")
    public ResponseEntity<ApiResponse<SelfieDocument>> approveSelfie(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId
    ) {
        try {
            logger.info("Approving Selfie document: {} by admin: {}", documentId, adminUserId);
            SelfieDocument approved = kycService.approveSelfie(documentId, adminUserId);
            return ResponseEntity.ok(new ApiResponse<>(true, "Selfie document approved", approved));
        } catch (Exception e) {
            logger.error("Error approving Selfie document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error approving Selfie: " + e.getMessage(), null));
        }
    }
    
    /**
     * Reject Selfie document (Admin only)
     */
    @PostMapping("/selfie/{documentId}/reject")
    public ResponseEntity<ApiResponse<SelfieDocument>> rejectSelfie(
            @PathVariable String documentId,
            @RequestParam("adminUserId") String adminUserId,
            @RequestParam("rejectionReason") String rejectionReason
    ) {
        try {
            logger.info("Rejecting Selfie document: {} by admin: {}", documentId, adminUserId);
            SelfieDocument rejected = kycService.rejectSelfie(documentId, adminUserId, rejectionReason);
            return ResponseEntity.ok(new ApiResponse<>(true, "Selfie document rejected", rejected));
        } catch (Exception e) {
            logger.error("Error rejecting Selfie document: {}", documentId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error rejecting Selfie: " + e.getMessage(), null));
        }
    }
    
    /**
     * Download KYC documents as PDF (Admin only)
     */
    @GetMapping("/download/{userId}/pdf")
    public ResponseEntity<?> downloadKYCPDF(@PathVariable String userId) {
        try {
            logger.info("Generating PDF for KYC documents of userId: {}", userId);
            
            // Get all documents
            Optional<AadhaarDocument> aadhaar = kycService.getAadhaarByUserId(userId);
            Optional<PANDocument> pan = kycService.getPANByUserId(userId);
            Optional<SelfieDocument> selfie = kycService.getSelfieByUserId(userId);
            
            // Generate PDF using iText or similar library
            // For now, return a zip file with all images
            return kycService.generateKYCPDF(userId, aadhaar, pan, selfie);
            
        } catch (Exception e) {
            logger.error("Error generating PDF for userId: {}", userId, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error generating PDF: " + e.getMessage(), null));
        }
    }
    
    /**
     * Download individual document image
     */
    @GetMapping("/download/image")
    public ResponseEntity<?> downloadImage(@RequestParam("path") String imagePath) {
        try {
            logger.info("Downloading image: {}", imagePath);
            return kycService.downloadImage(imagePath);
        } catch (Exception e) {
            logger.error("Error downloading image: {}", imagePath, e);
            return ResponseEntity.badRequest()
                .body(new ApiResponse<>(false, "Error downloading image: " + e.getMessage(), null));
        }
    }
    
    /**
     * Get Aadhaar front image from database collection (for display)
     */
    @GetMapping("/aadhaar/{userId}/image/front")
    public ResponseEntity<?> getAadhaarFrontImage(@PathVariable String userId) {
        try {
            logger.info("Fetching Aadhaar front image for userId: {}", userId);
            Optional<AadhaarDocument> aadhaar = kycService.getAadhaarByUserId(userId);
            if (aadhaar.isPresent() && aadhaar.get().getFrontImageUrl() != null) {
                return kycService.serveImage(aadhaar.get().getFrontImageUrl(), true);
            }
            logger.warn("Aadhaar front image not found for userId: {}", userId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching Aadhaar front image for userId: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get Aadhaar back image from database collection (for display)
     */
    @GetMapping("/aadhaar/{userId}/image/back")
    public ResponseEntity<?> getAadhaarBackImage(@PathVariable String userId) {
        try {
            logger.info("Fetching Aadhaar back image for userId: {}", userId);
            Optional<AadhaarDocument> aadhaar = kycService.getAadhaarByUserId(userId);
            if (aadhaar.isPresent() && aadhaar.get().getBackImageUrl() != null) {
                return kycService.serveImage(aadhaar.get().getBackImageUrl(), true);
            }
            logger.warn("Aadhaar back image not found for userId: {}", userId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching Aadhaar back image for userId: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get PAN image from database collection (for display)
     */
    @GetMapping("/pan/{userId}/image")
    public ResponseEntity<?> getPANImage(@PathVariable String userId) {
        try {
            logger.info("Fetching PAN image for userId: {}", userId);
            Optional<PANDocument> pan = kycService.getPANByUserId(userId);
            if (pan.isPresent() && pan.get().getPanImageUrl() != null) {
                return kycService.serveImage(pan.get().getPanImageUrl(), true);
            }
            logger.warn("PAN image not found for userId: {}", userId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching PAN image for userId: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
    
    /**
     * Get Selfie image from database collection (for display)
     */
    @GetMapping("/selfie/{userId}/image")
    public ResponseEntity<?> getSelfieImage(@PathVariable String userId) {
        try {
            logger.info("Fetching Selfie image for userId: {}", userId);
            Optional<SelfieDocument> selfie = kycService.getSelfieByUserId(userId);
            if (selfie.isPresent() && selfie.get().getSelfieImageUrl() != null) {
                return kycService.serveImage(selfie.get().getSelfieImageUrl(), true);
            }
            logger.warn("Selfie image not found for userId: {}", userId);
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            logger.error("Error fetching Selfie image for userId: {}", userId, e);
            return ResponseEntity.badRequest().build();
        }
    }
}
