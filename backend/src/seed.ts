import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { ProductsService } from './modules/products/products.service.js';
import { CategoriesService } from './modules/categories/categories.service.js';
import { faker } from '@faker-js/faker';

async function bootstrap() {
  console.log('🚀 Starting Seeding Process...');

  // Create a headless Nest application context
  const app = await NestFactory.createApplicationContext(AppModule);

  const categoriesService = app.get(CategoriesService);
  const productsService = app.get(ProductsService);

  // 1. Clear existing data (optional, but good for clean seeding)
  // For simplicity, we will just add new ones, or you can drop db.
  console.log('📦 Creating Categories...');
  const categoryNames = ['Électronique', 'Vêtements', 'Maison', 'Jardin', 'Sport'];
  const categories = [];

  for (const name of categoryNames) {
    const exists = await categoriesService.exists({ name });
    if (exists) {
      const found = await categoriesService.findAllCategories();
      categories.push(found.find(c => c.name === name));
    } else {
      const category = await categoriesService.createCategory(name);
      categories.push(category);
    }
  }

  console.log('🛒 Creating Products...');
  for (let i = 0; i < 20; i++) {
    const randomCategory = categories[Math.floor(Math.random() * categories.length)];
    const productName = faker.commerce.productName();
    
    try {
      await productsService.createProduct({
        name: productName,
        sku: `SKU-${faker.string.alphanumeric(8).toUpperCase()}-${i}`,
        description: faker.commerce.productDescription(),
        price: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        quantity: faker.number.int({ min: 0, max: 500 }),
        categoryId: randomCategory!._id.toString(),
      });
      console.log(`✅ Product ${i + 1}/20 created: ${productName}`);
    } catch (error) {
      console.error(`❌ Failed to create product ${i + 1}:`, (error as Error).message);
    }
  }

  console.log('🎉 Seeding completed successfully!');
  await app.close();
  process.exit(0);
}

bootstrap().catch(err => {
  console.error('Seeding failed', err);
  process.exit(1);
});
