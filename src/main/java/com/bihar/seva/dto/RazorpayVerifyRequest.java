package com.bihar.seva.dto;

import lombok.Data;

@Data
public class RazorpayVerifyRequest {
    private String bookingId;
    private String razorpayOrderId;
    private String razorpayPaymentId;
    private String razorpaySignature;
}
