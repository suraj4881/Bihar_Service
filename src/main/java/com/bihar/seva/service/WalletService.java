package com.bihar.seva.service;

import com.bihar.seva.model.Wallet;
import com.bihar.seva.model.WalletTransaction;
import com.bihar.seva.model.User;
import com.bihar.seva.repositories.WalletRepository;
import com.bihar.seva.repositories.WalletTransactionRepository;
import com.bihar.seva.repositories.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Wallet Service - Manages user wallets and transactions
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class WalletService {
    
    private final WalletRepository walletRepository;
    private final WalletTransactionRepository transactionRepository;
    private final UserRepository userRepository;
    
    /**
     * Get or create wallet for user
     */
    public Wallet getOrCreateWallet(String userId) {
        Optional<Wallet> walletOpt = walletRepository.findByUserId(userId);
        
        if (walletOpt.isPresent()) {
            return walletOpt.get();
        }
        
        // Create new wallet
        User user = userRepository.findById(userId)
            .orElseThrow(() -> new RuntimeException("User not found: " + userId));
        
        Wallet wallet = new Wallet();
        wallet.setUserId(userId);
        wallet.setUserRole(user.getRole());
        wallet.setBalance(0.0);
        wallet.setCurrency("INR");
        wallet.setIsActive(true);
        wallet.setIsLocked(false);
        wallet.setCreatedAt(LocalDateTime.now());
        wallet.setUpdatedAt(LocalDateTime.now());
        
        Wallet savedWallet = walletRepository.save(wallet);
        log.info("Created new wallet for user: {}", userId);
        return savedWallet;
    }
    
    /**
     * Get wallet balance
     */
    public Double getBalance(String userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return wallet.getBalance();
    }
    
    /**
     * Add amount to wallet
     */
    @Transactional
    public Wallet addBalance(String userId, Double amount, String description, String transactionType) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        Wallet wallet = getOrCreateWallet(userId);
        
        // Check max balance limit
        if (wallet.getBalance() + amount > wallet.getMaxBalance()) {
            throw new RuntimeException("Wallet balance exceeds maximum limit");
        }
        
        // Add balance
        wallet.addBalance(amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet updatedWallet = walletRepository.save(wallet);
        
        // Create transaction record
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setUserId(userId);
        transaction.setAmount(amount);
        transaction.setTransactionType(transactionType); // CREDIT, DEBIT, REFUND, PAYOUT
        transaction.setDescription(description);
        transaction.setBalanceBefore(wallet.getBalance() - amount);
        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setStatus("SUCCESS");
        transaction.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(transaction);
        
        log.info("Added {} to wallet for user: {}. New balance: {}", amount, userId, wallet.getBalance());
        return updatedWallet;
    }
    
    /**
     * Deduct amount from wallet
     */
    @Transactional
    public Wallet deductBalance(String userId, Double amount, String description, String transactionType) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }
        
        Wallet wallet = getOrCreateWallet(userId);
        
        if (wallet.getIsLocked()) {
            throw new RuntimeException("Wallet is locked");
        }
        
        // Check sufficient balance
        if (wallet.getBalance() < amount) {
            throw new RuntimeException("Insufficient wallet balance");
        }
        
        // Deduct balance
        boolean success = wallet.deductBalance(amount);
        if (!success) {
            throw new RuntimeException("Failed to deduct balance");
        }
        
        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet updatedWallet = walletRepository.save(wallet);
        
        // Create transaction record
        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setUserId(userId);
        transaction.setAmount(amount);
        transaction.setTransactionType(transactionType);
        transaction.setDescription(description);
        transaction.setBalanceBefore(wallet.getBalance() + amount);
        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setStatus("SUCCESS");
        transaction.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(transaction);
        
        log.info("Deducted {} from wallet for user: {}. New balance: {}", amount, userId, wallet.getBalance());
        return updatedWallet;
    }

    /**
     * Hold balance for withdrawal (creates PENDING transaction)
     */
    @Transactional
    public Wallet holdForWithdrawal(String userId, Double amount, String description, String referenceId) {
        if (amount <= 0) {
            throw new IllegalArgumentException("Amount must be positive");
        }

        Wallet wallet = getOrCreateWallet(userId);
        if (wallet.getIsLocked()) {
            throw new RuntimeException("Wallet is locked");
        }
        if (wallet.getBalance() < amount) {
            throw new RuntimeException("Insufficient wallet balance");
        }

        boolean success = wallet.deductBalance(amount);
        if (!success) {
            throw new RuntimeException("Failed to hold balance");
        }

        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet updatedWallet = walletRepository.save(wallet);

        WalletTransaction transaction = new WalletTransaction();
        transaction.setWalletId(wallet.getId());
        transaction.setUserId(userId);
        transaction.setAmount(amount);
        transaction.setTransactionType("WITHDRAWAL");
        transaction.setTransactionCategory("WITHDRAWAL");
        transaction.setDescription(description);
        transaction.setBalanceBefore(wallet.getBalance() + amount);
        transaction.setBalanceAfter(wallet.getBalance());
        transaction.setStatus("PENDING");
        transaction.setReferenceId(referenceId);
        transaction.setReferenceType("WITHDRAWAL");
        transaction.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(transaction);

        return updatedWallet;
    }

    /**
     * Release withdrawal hold on rejection
     */
    @Transactional
    public Wallet releaseWithdrawalHold(String userId, Double amount, String referenceId, String reason) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.addBalance(amount);
        wallet.setUpdatedAt(LocalDateTime.now());
        Wallet updatedWallet = walletRepository.save(wallet);

        WalletTransaction reversal = new WalletTransaction();
        reversal.setWalletId(wallet.getId());
        reversal.setUserId(userId);
        reversal.setAmount(amount);
        reversal.setTransactionType("WITHDRAWAL_REVERSAL");
        reversal.setTransactionCategory("WITHDRAWAL");
        reversal.setDescription(reason);
        reversal.setBalanceBefore(wallet.getBalance() - amount);
        reversal.setBalanceAfter(wallet.getBalance());
        reversal.setStatus("SUCCESS");
        reversal.setReferenceId(referenceId);
        reversal.setReferenceType("WITHDRAWAL");
        reversal.setCreatedAt(LocalDateTime.now());
        transactionRepository.save(reversal);

        return updatedWallet;
    }

    public void markWithdrawalTransaction(String referenceId, String status, String failureReason) {
        List<WalletTransaction> transactions = transactionRepository.findByReferenceIdAndReferenceType(referenceId, "WITHDRAWAL");
        for (WalletTransaction tx : transactions) {
            tx.setStatus(status);
            tx.setFailureReason(failureReason);
            transactionRepository.save(tx);
        }
    }
    
    /**
     * Transfer amount between wallets
     */
    @Transactional
    public void transferBalance(String fromUserId, String toUserId, Double amount, String description) {
        deductBalance(fromUserId, amount, "Transfer to " + toUserId, "TRANSFER_OUT");
        addBalance(toUserId, amount, "Transfer from " + fromUserId, "TRANSFER_IN");
        log.info("Transferred {} from {} to {}", amount, fromUserId, toUserId);
    }
    
    /**
     * Get transaction history
     */
    public List<WalletTransaction> getTransactionHistory(String userId) {
        Wallet wallet = getOrCreateWallet(userId);
        return transactionRepository.findByWalletIdOrderByCreatedAtDesc(wallet.getId());
    }
    
    /**
     * Lock wallet (admin action)
     */
    public Wallet lockWallet(String userId) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setIsLocked(true);
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }
    
    /**
     * Unlock wallet (admin action)
     */
    public Wallet unlockWallet(String userId) {
        Wallet wallet = getOrCreateWallet(userId);
        wallet.setIsLocked(false);
        wallet.setUpdatedAt(LocalDateTime.now());
        return walletRepository.save(wallet);
    }
}
