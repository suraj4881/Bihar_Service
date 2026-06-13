// MongoDB script to fix text index conflict
// Run this with: mongosh bihar_seva fix-mongo-text-index.js

print("🔧 Fixing MongoDB text index conflict...");

// Switch to bihar_seva database
db = db.getSiblingDB('bihar_seva');

// Check existing indexes on services collection
print("\n📋 Current indexes on 'services' collection:");
var indexes = db.services.getIndexes();
indexes.forEach(function(index) {
    print("  - " + index.name + ": " + JSON.stringify(index.key));
});

// Drop old Service_TextIndex if exists
print("\n🗑️  Dropping old Service_TextIndex...");
try {
    db.services.dropIndex("Service_TextIndex");
    print("✅ Successfully dropped Service_TextIndex");
} catch (e) {
    if (e.code === 27) {
        print("ℹ️  Service_TextIndex not found (already removed)");
    } else {
        print("⚠️  Error dropping Service_TextIndex: " + e.message);
    }
}

// Drop DynamicService_TextIndex if exists (in case it was partially created)
print("\n🗑️  Dropping DynamicService_TextIndex if exists...");
try {
    db.services.dropIndex("DynamicService_TextIndex");
    print("✅ Successfully dropped DynamicService_TextIndex");
} catch (e) {
    if (e.code === 27) {
        print("ℹ️  DynamicService_TextIndex not found (ok)");
    } else {
        print("⚠️  Error dropping DynamicService_TextIndex: " + e.message);
    }
}

// Create new text index on serviceName field
print("\n✨ Creating new text index on serviceName field...");
try {
    db.services.createIndex(
        { serviceName: "text" },
        { name: "DynamicService_TextIndex" }
    );
    print("✅ Successfully created DynamicService_TextIndex");
} catch (e) {
    if (e.code === 85) {
        print("⚠️  Index conflict (may already exist with different options)");
    } else {
        print("⚠️  Error creating index: " + e.message);
    }
}

// Verify final indexes
print("\n📋 Final indexes on 'services' collection:");
var finalIndexes = db.services.getIndexes();
finalIndexes.forEach(function(index) {
    print("  - " + index.name + ": " + JSON.stringify(index.key));
});

print("\n✅ Index fix completed!");
