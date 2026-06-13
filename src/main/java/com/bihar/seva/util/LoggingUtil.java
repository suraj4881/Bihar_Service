package com.bihar.seva.util;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.UUID;

@Component
public class LoggingUtil {
    
    private static final Logger logger = LoggerFactory.getLogger(LoggingUtil.class);
    private static final DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS");
    
    public static void logMethodEntry(Logger logger, String methodName, Object... params) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("method", methodName);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        
        logger.info("Entering method: {} with parameters: {}", methodName, params);
    }
    
    public static void logMethodExit(Logger logger, String methodName, Object result) {
        logger.info("Exiting method: {} with result: {}", methodName, result);
        MDC.clear();
    }
    
    public static void logError(Logger logger, String methodName, Exception ex, Object... context) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("method", methodName);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        MDC.put("error", ex.getClass().getSimpleName());
        
        logger.error("Error in method: {} with context: {} - Error: {}", methodName, context, ex.getMessage(), ex);
        MDC.clear();
    }
    
    public static void logWarning(Logger logger, String methodName, String message, Object... context) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("method", methodName);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        
        logger.warn("Warning in method: {} - {} with context: {}", methodName, message, context);
        MDC.clear();
    }
    
    public static void logInfo(Logger logger, String methodName, String message, Object... context) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("method", methodName);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        
        logger.info("Info in method: {} - {} with context: {}", methodName, message, context);
        MDC.clear();
    }
    
    public static void logDebug(Logger logger, String methodName, String message, Object... context) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("method", methodName);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        
        logger.debug("Debug in method: {} - {} with context: {}", methodName, message, context);
        MDC.clear();
    }
    
    public static void logSecurityEvent(Logger logger, String event, String userId, String details) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("event", event);
        MDC.put("userId", userId);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        MDC.put("logType", "SECURITY");
        
        logger.warn("Security Event: {} - User: {} - Details: {}", event, userId, details);
        MDC.clear();
    }
    
    public static void logDatabaseOperation(Logger logger, String operation, String collection, Object id, Object result) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("operation", operation);
        MDC.put("collection", collection);
        MDC.put("documentId", String.valueOf(id));
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        MDC.put("logType", "DATABASE");
        
        logger.info("Database Operation: {} on collection: {} with ID: {} - Result: {}", 
                   operation, collection, id, result);
        MDC.clear();
    }
    
    public static void logApiCall(Logger logger, String method, String endpoint, Object request, Object response, long duration) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("httpMethod", method);
        MDC.put("endpoint", endpoint);
        MDC.put("duration", String.valueOf(duration));
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        MDC.put("logType", "API");
        
        logger.info("API Call: {} {} - Request: {} - Response: {} - Duration: {}ms", 
                   method, endpoint, request, response, duration);
        MDC.clear();
    }
    
    public static void logPerformance(Logger logger, String operation, long duration, String threshold) {
        String requestId = generateRequestId();
        MDC.put("requestId", requestId);
        MDC.put("operation", operation);
        MDC.put("duration", String.valueOf(duration));
        MDC.put("threshold", threshold);
        MDC.put("timestamp", LocalDateTime.now().format(formatter));
        MDC.put("logType", "PERFORMANCE");
        
        if (duration > Long.parseLong(threshold)) {
            logger.warn("Performance Warning: {} took {}ms (threshold: {}ms)", operation, duration, threshold);
        } else {
            logger.info("Performance: {} completed in {}ms", operation, duration);
        }
        MDC.clear();
    }
    
    private static String generateRequestId() {
        return UUID.randomUUID().toString().substring(0, 8);
    }
    
    public static void setUserContext(String userId, String userType) {
        MDC.put("userId", userId);
        MDC.put("userType", userType);
    }
    
    public static void clearUserContext() {
        MDC.remove("userId");
        MDC.remove("userType");
    }
    
    public static void setRequestContext(String requestId, String ipAddress, String userAgent) {
        MDC.put("requestId", requestId);
        MDC.put("ipAddress", ipAddress);
        MDC.put("userAgent", userAgent);
    }
    
    public static void clearRequestContext() {
        MDC.remove("requestId");
        MDC.remove("ipAddress");
        MDC.remove("userAgent");
    }
}
