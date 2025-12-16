package com.bihar.seva.config;

import com.mongodb.MongoCommandException;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import lombok.extern.slf4j.Slf4j;
import org.bson.Document;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
@Slf4j
public class MongoIndexFixer implements CommandLineRunner {
    
    @Autowired
    private MongoTemplate mongoTemplate;
    
    @Override
    public void run(String... args) {
        try {
            log.info("🔧 Checking and fixing MongoDB indexes...");
            
            MongoDatabase database = mongoTemplate.getDb();
            MongoCollection<Document> usersCollection = database.getCollection("users");
            
            // Check if phone_1 index exists before trying to drop it
            List<Document> indexes = new ArrayList<>();
            usersCollection.listIndexes().into(indexes);
            
            boolean phoneIndexExists = false;
            for (Document index : indexes) {
                String indexName = index.getString("name");
                if ("phone_1".equals(indexName)) {
                    phoneIndexExists = true;
                    break;
                }
            }
            
            // Drop old phone index only if it exists
            if (phoneIndexExists) {
                try {
                    usersCollection.dropIndex("phone_1");
                    log.info("✅ Dropped old phone index (phone_1)");
                } catch (MongoCommandException e) {
                    // Check if error is IndexNotFound (code 27)
                    if (e.getCode() == 27) {
                        log.debug("ℹ️  Phone index (phone_1) not found - already removed");
                    } else {
                        log.warn("⚠️  Could not drop phone index: {}", e.getMessage());
                    }
                } catch (Exception e) {
                    log.warn("⚠️  Unexpected error dropping phone index: {}", e.getMessage());
                }
            } else {
                log.debug("ℹ️  Phone index (phone_1) does not exist - skipping drop");
            }
            
            log.info("✅ MongoDB index check completed!");
            
        } catch (Exception e) {
            log.warn("⚠️  Error checking MongoDB indexes (non-critical): {}", e.getMessage());
            // Don't fail startup if index check fails
        }
    }
}

