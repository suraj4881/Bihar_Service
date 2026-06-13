package com.bihar.seva.service;

import com.bihar.seva.model.Booking;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.Map;

@Service
@Slf4j
public class CallProxyService {

    @Value("${callproxy.enabled:false}")
    private boolean callProxyEnabled;

    @Value("${callproxy.number:}")
    private String proxyNumber;

    public Map<String, Object> initiateMaskedCall(Booking booking) {
        Map<String, Object> response = new HashMap<>();
        response.put("enabled", callProxyEnabled);

        if (!callProxyEnabled || proxyNumber == null || proxyNumber.trim().isEmpty()) {
            response.put("message", "Call proxy not configured");
            return response;
        }

        response.put("proxyNumber", proxyNumber);
        response.put("bookingId", booking.getId());
        response.put("message", "Call proxy ready");
        log.info("Masked call ready for booking {}", booking.getId());

        return response;
    }
}
