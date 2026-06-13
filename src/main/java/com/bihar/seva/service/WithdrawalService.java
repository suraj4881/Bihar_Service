package com.bihar.seva.service;

import com.bihar.seva.dto.WithdrawalRequestDTO;
import com.bihar.seva.model.User;
import com.bihar.seva.model.WithdrawalRequest;
import com.bihar.seva.repositories.UserRepository;
import com.bihar.seva.repositories.WithdrawalRequestRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class WithdrawalService {

    private final WithdrawalRequestRepository withdrawalRequestRepository;
    private final UserRepository userRepository;
    private final WalletService walletService;

    public WithdrawalRequest createRequest(WithdrawalRequestDTO request) {
        User provider = userRepository.findById(request.getProviderId())
            .orElseThrow(() -> new RuntimeException("Provider not found"));
        if (!"PROVIDER".equals(provider.getRole())) {
            throw new RuntimeException("User is not a provider");
        }
        if (request.getAmount() == null || request.getAmount() <= 0) {
            throw new RuntimeException("Invalid withdrawal amount");
        }
        if (request.getMethod() == null || request.getMethod().isBlank()) {
            throw new RuntimeException("Withdrawal method required");
        }

        WithdrawalRequest withdrawal = new WithdrawalRequest();
        withdrawal.setProviderId(request.getProviderId());
        withdrawal.setAmount(request.getAmount());
        withdrawal.setMethod(request.getMethod());
        withdrawal.setUpiId(request.getUpiId());
        withdrawal.setAccountHolderName(request.getAccountHolderName());
        withdrawal.setAccountNumber(request.getAccountNumber());
        withdrawal.setIfsc(request.getIfsc());
        withdrawal.setBankName(request.getBankName());
        withdrawal.setStatus("PENDING");
        withdrawal.setRequestedAt(LocalDateTime.now());
        withdrawal.setUpdatedAt(LocalDateTime.now());

        WithdrawalRequest saved = withdrawalRequestRepository.save(withdrawal);
        walletService.holdForWithdrawal(
            request.getProviderId(),
            request.getAmount(),
            "Withdrawal request: " + saved.getId(),
            saved.getId()
        );
        return saved;
    }

    public List<WithdrawalRequest> getByProvider(String providerId) {
        return withdrawalRequestRepository.findByProviderIdOrderByRequestedAtDesc(providerId);
    }

    public List<WithdrawalRequest> getAll() {
        return withdrawalRequestRepository.findAllByOrderByRequestedAtDesc();
    }

    public WithdrawalRequest updateStatus(String id, String status, String remarks) {
        WithdrawalRequest request = withdrawalRequestRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Withdrawal request not found"));

        request.setStatus(status);
        request.setRemarks(remarks);
        request.setUpdatedAt(LocalDateTime.now());

        if ("REJECTED".equals(status)) {
            walletService.releaseWithdrawalHold(
                request.getProviderId(),
                request.getAmount(),
                request.getId(),
                remarks != null ? remarks : "Withdrawal rejected"
            );
            walletService.markWithdrawalTransaction(request.getId(), "FAILED", remarks);
        }
        if ("PAID".equals(status)) {
            walletService.markWithdrawalTransaction(request.getId(), "SUCCESS", null);
        }

        return withdrawalRequestRepository.save(request);
    }
}
