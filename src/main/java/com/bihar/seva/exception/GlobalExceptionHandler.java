package com.bihar.seva.exception;

import com.bihar.seva.dto.ApiResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

import javax.validation.ConstraintViolation;
import javax.validation.ConstraintViolationException;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {
    
    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Object>> handleGlobalException(Exception ex, WebRequest request) {
        logger.error("Global exception occurred: {}", ex.getMessage(), ex);
        
        ApiResponse<Object> response = ApiResponse.error(
            "An unexpected error occurred. Please try again later.",
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
    
    @ExceptionHandler(NullPointerException.class)
    public ResponseEntity<ApiResponse<Object>> handleNullPointerException(NullPointerException ex, WebRequest request) {
        logger.error("Null pointer exception occurred: {}", ex.getMessage(), ex);
        
        ApiResponse<Object> response = ApiResponse.error(
            "A null reference was encountered. Please check your request data.",
            "NullPointerException: " + ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ApiResponse<Object>> handleIllegalArgumentException(IllegalArgumentException ex, WebRequest request) {
        logger.warn("Illegal argument exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Invalid argument provided: " + ex.getMessage(),
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<ApiResponse<Object>> handleRuntimeException(RuntimeException ex, WebRequest request) {
        logger.error("Runtime exception occurred: {}", ex.getMessage(), ex);
        
        ApiResponse<Object> response = ApiResponse.error(
            ex.getMessage(),
            ex.getClass().getSimpleName() + ": " + ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        logger.warn("Validation exception occurred: {}", ex.getMessage());
        
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        
        ApiResponse<Object> response = ApiResponse.error(
            "Validation failed",
            errors.toString()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ApiResponse<Object>> handleConstraintViolationException(ConstraintViolationException ex) {
        logger.warn("Constraint violation exception: {}", ex.getMessage());
        
        String message = ex.getConstraintViolations()
            .stream()
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.joining(", "));
        
        ApiResponse<Object> response = ApiResponse.error(
            "Validation failed: " + message,
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
    
    @ExceptionHandler(AuthenticationException.class)
    public ResponseEntity<ApiResponse<Object>> handleAuthenticationException(AuthenticationException ex, WebRequest request) {
        logger.warn("Authentication exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Authentication failed. Please check your credentials.",
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
    
    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ApiResponse<Object>> handleBadCredentialsException(BadCredentialsException ex, WebRequest request) {
        logger.warn("Bad credentials exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Invalid email or password. Please try again.",
            "BadCredentialsException"
        );
        
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
    }
    
    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ApiResponse<Object>> handleAccessDeniedException(AccessDeniedException ex, WebRequest request) {
        logger.warn("Access denied exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "Access denied. You don't have permission to access this resource.",
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
    }
    
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ApiResponse<Object>> handleMaxUploadSizeExceededException(MaxUploadSizeExceededException ex, WebRequest request) {
        logger.warn("File upload size exceeded: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            "File size too large. Maximum allowed size is 10MB.",
            ex.getMessage()
        );
        
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE).body(response);
    }
    
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ApiResponse<Object>> handleResourceNotFoundException(ResourceNotFoundException ex, WebRequest request) {
        logger.warn("Resource not found: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            ex.getMessage(),
            ex.getClass().getSimpleName()
        );
        
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
    }
    
    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ApiResponse<Object>> handleDuplicateResourceException(DuplicateResourceException ex, WebRequest request) {
        logger.warn("Duplicate resource exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            ex.getMessage(),
            ex.getClass().getSimpleName()
        );
        
        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
    }
    
    @ExceptionHandler(ValidationException.class)
    public ResponseEntity<ApiResponse<Object>> handleValidationException(ValidationException ex, WebRequest request) {
        logger.warn("Custom validation exception: {}", ex.getMessage());
        
        ApiResponse<Object> response = ApiResponse.error(
            ex.getMessage(),
            ex.getClass().getSimpleName()
        );
        
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
    }
}
