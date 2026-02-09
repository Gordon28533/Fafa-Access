/**
 * Test Data Seeding Script
 * Creates sample laptops and data for testing
 */

import process from 'process';
import { db } from './src/db/connection.ts';
import { laptops } from './src/db/schema/applications.ts';

async function seedTestData() {
  console.log('📊 Seeding test data...\n');

  try {
    // Create sample laptops
    const testLaptops = [
      {
        brand: 'Dell',
        model: 'Inspiron 15',
        serialNumber: 'DELL-DEL-' + Date.now(),
        originalPrice: 1200,
        discountedPrice: 999,
        stockQuantity: 10,
        isActive: true,
        price: 999,
        processor: 'Intel i5-1135G7',
        ram: '8GB DDR4',
        storage: '512GB SSD'
      },
      {
        brand: 'HP',
        model: 'Pavilion 14',
        serialNumber: 'HP-PAV-' + Date.now(),
        originalPrice: 1000,
        discountedPrice: 799,
        stockQuantity: 15,
        isActive: true,
        price: 799,
        processor: 'AMD Ryzen 5 5500U',
        ram: '8GB DDR4',
        storage: '256GB SSD'
      },
      {
        brand: 'Lenovo',
        model: 'ThinkBook 13',
        serialNumber: 'LEN-THK-' + Date.now(),
        originalPrice: 1100,
        discountedPrice: 899,
        stockQuantity: 8,
        isActive: true,
        price: 899,
        processor: 'Intel i7-1165G7',
        ram: '16GB DDR4',
        storage: '512GB SSD'
      },
      {
        brand: 'ASUS',
        model: 'VivoBook 15',
        serialNumber: 'ASUS-VIV-' + Date.now(),
        originalPrice: 950,
        discountedPrice: 749,
        stockQuantity: 12,
        isActive: true,
        price: 749,
        processor: 'AMD Ryzen 7 5700U',
        ram: '8GB DDR4',
        storage: '512GB SSD'
      }
    ];

    let createdCount = 0;

    for (const laptop of testLaptops) {
      try {
        // Insert laptop
        const [newLaptop] = await db
          .insert(laptops)
          .values({
            brand: laptop.brand,
            model: laptop.model,
            serialNumber: laptop.serialNumber,
            originalPrice: laptop.originalPrice,
            discountedPrice: laptop.discountedPrice,
            stockQuantity: laptop.stockQuantity,
            isActive: laptop.isActive,
            price: laptop.price,
            processor: laptop.processor,
            ram: laptop.ram,
            storage: laptop.storage
          })
          .returning();

        console.log(`✅ ${laptop.brand} ${laptop.model}`);
        console.log(`   Price: GHS ${laptop.discountedPrice} (was GHS ${laptop.originalPrice})`);
        console.log(`   Stock: ${laptop.stockQuantity} units`);
        console.log(`   Serial: ${laptop.serialNumber}`);
        console.log(`   ID: ${newLaptop.id}\n`);
        
        createdCount++;
      } catch (error) {
        // Likely duplicate serial number - skip
        console.log(`⏭️  ${laptop.brand} ${laptop.model} (already exists)\n`);
      }
    }

    console.log(`\n✨ Created ${createdCount} sample laptops!\n`);

  } catch (error) {
    console.error('❌ Error seeding data:', (error as Error).message);
    process.exit(1);
  }
}

seedTestData();
