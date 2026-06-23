import { PrismaPg } from "@prisma/adapter-pg";
import pkg from "@prisma/client";

const { PrismaClient } = pkg;
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  const counts = {
    categories: await prisma.productCategory.count(),
    products: await prisma.product.count(),
    rentalUnits: await prisma.rentalUnit.count(),
    services: await prisma.service.count(),
    blogPosts: await prisma.blogPost.count(),
    events: await prisma.event.count(),
    testimonials: await prisma.testimonial.count(),
    permissions: await prisma.permission.count(),
    roles: await prisma.role.count(),
    adminUsers: await prisma.adminUser.count(),
    siteSettings: await prisma.siteSetting.count(),
  };
  console.table(counts);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
