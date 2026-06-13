package com.bihar.seva.dto;

import lombok.Data;

@Data
public class WithdrawalRequestDTO {
    private String providerId;
    private Double amount;
    private String method; // UPI, BANK
    private String upiId;
    private String accountHolderName;
    private String accountNumber;
    private String ifsc;
    private String bankName;
}
