package com.bihar.seva.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.json.JSONArray;
import org.json.JSONObject;

/**
 * WhatsApp Service for sending notifications via Meta WhatsApp Business API
 */
@Service
@Slf4j
public class WhatsAppService {

    private final RestTemplate restTemplate = new RestTemplate();

    @Value("${whatsapp.meta.enabled:false}")
    private boolean whatsappEnabled;

    @Value("${whatsapp.meta.api.url:https://graph.facebook.com/v18.0}")
    private String apiUrl;

    @Value("${whatsapp.meta.access.token:}")
    private String accessToken;

    @Value("${whatsapp.meta.phone.number.id:}")
    private String phoneNumberId;

    @Value("${whatsapp.meta.template.payment.success.en:payment_success_en}")
    private String templatePaymentSuccessEn;

    @Value("${whatsapp.meta.template.payment.success.hi:payment_success_hi}")
    private String templatePaymentSuccessHi;

    /**
     * Send simple text WhatsApp message (for backward compatibility)
     */
    public boolean sendWhatsAppMessage(String phoneNumber, String message) {
        try {
            if (!whatsappEnabled || accessToken == null || accessToken.isBlank()) {
                log.info("💬 ========================================");
                log.info("💬 WHATSAPP TO: {}", phoneNumber);
                log.info("💬 MESSAGE: {}", message);
                log.info("💬 ========================================");
                log.info("✅ WhatsApp message logged (Meta API not configured)");
                return true;
            }

            String formattedPhone = formatPhoneNumber(phoneNumber);
            String url = apiUrl + "/" + phoneNumberId + "/messages";

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            JSONObject requestBody = new JSONObject();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("to", formattedPhone);
            requestBody.put("type", "text");
            
            JSONObject textObject = new JSONObject();
            textObject.put("body", message);
            requestBody.put("text", textObject);

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
            ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ WhatsApp message sent successfully to {}", formattedPhone);
                return true;
            } else {
                log.error("❌ Failed to send WhatsApp message. Status: {}, Response: {}", 
                    response.getStatusCode(), response.getBody());
                return false;
            }
        } catch (Exception e) {
            log.error("❌ Error sending WhatsApp message to {}: {}", phoneNumber, e.getMessage(), e);
            return false;
        }
    }

    /**
     * Send template-based WhatsApp message for payment success
     * @param phoneNumber Recipient phone number
     * @param language User language preference ("English" or "Hindi")
     * @param bookingId Booking ID
     * @param amount Payment amount
     * @return true if sent successfully
     */
    public boolean sendPaymentSuccessTemplate(String phoneNumber, String language, String bookingId, Double amount) {
        try {
            log.info("💬 ========================================");
            log.info("💬 WhatsApp Template Send Request");
            log.info("💬 Phone: {}", phoneNumber);
            log.info("💬 Language: {}", language);
            log.info("💬 Booking ID: {}", bookingId);
            log.info("💬 Amount: ₹{}", amount);
            log.info("💬 WhatsApp Enabled: {}", whatsappEnabled);
            log.info("💬 Access Token Present: {}", (accessToken != null && !accessToken.isBlank()));
            log.info("💬 Phone Number ID: {}", phoneNumberId);
            log.info("💬 ========================================");
            
            if (!whatsappEnabled) {
                log.warn("⚠️ WhatsApp is disabled. Set whatsapp.meta.enabled=true");
                return false;
            }
            
            if (accessToken == null || accessToken.isBlank()) {
                log.error("❌ WhatsApp Access Token is not configured!");
                return false;
            }
            
            if (phoneNumberId == null || phoneNumberId.isBlank()) {
                log.error("❌ WhatsApp Phone Number ID is not configured!");
                return false;
            }

            String formattedPhone = formatPhoneNumber(phoneNumber);
            log.info("📱 Formatted Phone Number: {} -> {}", phoneNumber, formattedPhone);
            
            String url = apiUrl + "/" + phoneNumberId + "/messages";
            log.info("🌐 API URL: {}", url);

            // Determine template name and language code based on user preference
            String templateName;
            String languageCode;
            if (language != null && (language.equalsIgnoreCase("Hindi") || language.equalsIgnoreCase("hi"))) {
                templateName = templatePaymentSuccessHi;
                languageCode = "hi_IN";
            } else {
                templateName = templatePaymentSuccessEn;
                languageCode = "en_US";
            }

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(accessToken);

            JSONObject requestBody = new JSONObject();
            requestBody.put("messaging_product", "whatsapp");
            requestBody.put("to", formattedPhone);
            requestBody.put("type", "template");

            JSONObject templateObject = new JSONObject();
            templateObject.put("name", templateName);
            templateObject.put("language", new JSONObject().put("code", languageCode));

            // Template parameters - only add if template requires them
            // For hello_world template, no parameters needed
            // For payment_success templates, add parameters
            if (!templateName.equals("hello_world")) {
                JSONArray components = new JSONArray();
                
                // Body component with parameters
                JSONObject bodyComponent = new JSONObject();
                bodyComponent.put("type", "body");
                JSONArray bodyParameters = new JSONArray();
                
                // Add booking ID parameter
                JSONObject bookingIdParam = new JSONObject();
                bookingIdParam.put("type", "text");
                bookingIdParam.put("text", bookingId);
                bodyParameters.put(bookingIdParam);
                
                // Add amount parameter
                JSONObject amountParam = new JSONObject();
                amountParam.put("type", "text");
                amountParam.put("text", "₹" + (amount != null ? amount : "0"));
                bodyParameters.put(amountParam);
                
                bodyComponent.put("parameters", bodyParameters);
                components.put(bodyComponent);
                
                templateObject.put("components", components);
            }
            
            requestBody.put("template", templateObject);

            HttpEntity<String> entity = new HttpEntity<>(requestBody.toString(), headers);
            
            log.info("📤 ========================================");
            log.info("📤 Sending WhatsApp Template to Meta API");
            log.info("📤 URL: {}", url);
            log.info("📤 Template: {}", templateName);
            log.info("📤 Language: {}", languageCode);
            log.info("📤 Phone: {}", formattedPhone);
            log.info("📤 Request Body: {}", requestBody.toString(2));
            log.info("📤 ========================================");
            
            ResponseEntity<String> response;
            try {
                response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
            } catch (org.springframework.web.client.RestClientException e) {
                log.error("❌ ========================================");
                log.error("❌ REST Client Exception");
                log.error("❌ Error: {}", e.getMessage());
                log.error("❌ Cause: {}", e.getCause() != null ? e.getCause().getMessage() : "N/A");
                log.error("❌ ========================================");
                e.printStackTrace();
                return false;
            }

            log.info("📥 ========================================");
            log.info("📥 Meta API Response");
            log.info("📥 Status Code: {}", response.getStatusCode());
            log.info("📥 Response Body: {}", response.getBody());
            log.info("📥 ========================================");

            if (response.getStatusCode().is2xxSuccessful()) {
                log.info("✅ ========================================");
                log.info("✅ WhatsApp template sent successfully!");
                log.info("✅ Template: {}", templateName);
                log.info("✅ Language: {}", languageCode);
                log.info("✅ Phone: {}", formattedPhone);
                log.info("✅ ========================================");
                
                // Parse response to get message ID
                try {
                    JSONObject responseJson = new JSONObject(response.getBody());
                    if (responseJson.has("messages")) {
                        JSONArray messages = responseJson.getJSONArray("messages");
                        if (messages.length() > 0) {
                            JSONObject message = messages.getJSONObject(0);
                            log.info("✅ Message ID: {}", message.optString("id", "N/A"));
                        }
                    }
                } catch (Exception e) {
                    log.debug("Could not parse response JSON");
                }
                
                return true;
            } else {
                log.error("❌ ========================================");
                log.error("❌ Failed to send WhatsApp template");
                log.error("❌ Status Code: {}", response.getStatusCode());
                log.error("❌ Response: {}", response.getBody());
                
                // Try to parse error for better debugging
                try {
                    JSONObject errorResponse = new JSONObject(response.getBody());
                    if (errorResponse.has("error")) {
                        JSONObject error = errorResponse.getJSONObject("error");
                        log.error("❌ Error Type: {}", error.optString("type", "N/A"));
                        log.error("❌ Error Code: {}", error.optInt("code", -1));
                        log.error("❌ Error Message: {}", error.optString("message", "N/A"));
                        log.error("❌ Error Subcode: {}", error.optInt("error_subcode", -1));
                        if (error.has("error_data")) {
                            log.error("❌ Error Data: {}", error.getJSONObject("error_data").toString(2));
                        }
                    }
                    log.error("❌ Full Error Response: {}", errorResponse.toString(2));
                } catch (Exception e) {
                    log.error("❌ Could not parse error response: {}", e.getMessage());
                }
                log.error("❌ ========================================");
                return false;
            }
        } catch (Exception e) {
            log.error("❌ ========================================");
            log.error("❌ Exception in sendPaymentSuccessTemplate");
            log.error("❌ Phone: {}", phoneNumber);
            log.error("❌ Error: {}", e.getMessage());
            log.error("❌ Exception Type: {}", e.getClass().getName());
            if (e.getCause() != null) {
                log.error("❌ Cause: {}", e.getCause().getMessage());
            }
            log.error("❌ Stack Trace:");
            e.printStackTrace();
            log.error("❌ ========================================");
            return false;
        }
    }

    /**
     * Format phone number to international format (remove +, spaces, etc.)
     * Expected format: country code + phone number (e.g., 919876543210 for India)
     */
    private String formatPhoneNumber(String phoneNumber) {
        if (phoneNumber == null || phoneNumber.isBlank()) {
            return phoneNumber;
        }
        
        // Remove all non-digit characters
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        
        // If number starts with 0, remove it
        if (cleaned.startsWith("0")) {
            cleaned = cleaned.substring(1);
        }
        
        // If number doesn't start with country code (91 for India), add it
        if (!cleaned.startsWith("91") && cleaned.length() == 10) {
            cleaned = "91" + cleaned;
        }
        
        return cleaned;
    }
}
