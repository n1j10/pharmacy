import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const categories = [
  { name: "مسكنات الألم" },
  { name: "مضادات حيوية" },
  { name: "فيتامينات ومكملات" },
  { name: "أدوية الجهاز الهضمي" },
];

const medicines = [
  {
    name: "بنادول إكسترا",
    description: "مسكن للألم وخافض للحرارة.",
    barcode: "6281000000001",
    price: 2500,
    unit: "علبة",
    manufacturer: "جلاكسو سميث كلاين",
    category: "مسكنات الألم",
    quantity: 48,
    expiryDate: "2027-12-31",
    costPrice: 1800,
  },
  {
    name: "بروفين 400",
    description: "أقراص إيبوبروفين لتخفيف الألم والالتهاب.",
    barcode: "6281000000002",
    price: 3000,
    unit: "علبة",
    manufacturer: "آبوت",
    category: "مسكنات الألم",
    quantity: 35,
    expiryDate: "2027-09-30",
    costPrice: 2100,
  },
  {
    name: "أموكسيسيلين 500",
    description: "كبسولات مضاد حيوي.",
    barcode: "6281000000003",
    price: 5000,
    unit: "علبة",
    manufacturer: "الحكمة",
    category: "مضادات حيوية",
    quantity: 24,
    expiryDate: "2027-06-30",
    costPrice: 3500,
  },
  {
    name: "فيتامين سي 1000",
    description: "أقراص فوارة بنكهة البرتقال.",
    barcode: "6281000000004",
    price: 7500,
    unit: "علبة",
    manufacturer: "ناتشورال فاكتورز",
    category: "فيتامينات ومكملات",
    quantity: 30,
    expiryDate: "2028-02-28",
    costPrice: 5000,
  },
  {
    name: "جافيسكون شراب",
    description: "لتخفيف أعراض الحموضة وحرقة المعدة.",
    barcode: "6281000000005",
    price: 6000,
    unit: "علبة",
    manufacturer: "ريكت بنكيزر",
    category: "أدوية الجهاز الهضمي",
    quantity: 18,
    expiryDate: "2027-11-30",
    costPrice: 4200,
  },
];

async function main() {
  const adminPasswordHash = await bcrypt.hash("Admin@123", 12);
  const sellerPasswordHash = await bcrypt.hash("Seller@123", 12);
  const categoryIds = new Map();

  await prisma.pharmacySettings.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      pharmacyName: "صيدلية فارما سيس",
      phone: "07700000000",
      address: "بغداد",
      receiptFooter: "شكراً لزيارتكم — نتمنى لكم دوام الصحة",
      currency: "د.ع",
    },
  });

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    categoryIds.set(category.name, saved.id);
  }

  for (const medicine of medicines) {
    const { category, quantity, expiryDate, costPrice, ...medicineData } = medicine;
    const saved = await prisma.medicine.upsert({
      where: { barcode: medicine.barcode },
      update: {
        ...medicineData,
        categoryId: categoryIds.get(category),
      },
      create: {
        ...medicineData,
        categoryId: categoryIds.get(category),
      },
    });

    const existingBatch = await prisma.batch.findFirst({
      where: { medicineId: saved.id, expiryDate: new Date(expiryDate) },
    });

    if (existingBatch) {
      await prisma.batch.update({
        where: { id: existingBatch.id },
        data: { quantity, costPrice },
      });
    } else {
      await prisma.batch.create({
        data: {
          medicineId: saved.id,
          quantity,
          expiryDate: new Date(expiryDate),
          costPrice,
        },
      });
    }
  }

  await prisma.user.upsert({
    where: { email: "admin@pharmasys.local" },
    update: {
      name: "مدير النظام",
      role: "ADMIN",
      passwordHash: adminPasswordHash,
      isActive: true,
    },
    create: {
      email: "admin@pharmasys.local",
      passwordHash: adminPasswordHash,
      name: "مدير النظام",
      role: "ADMIN",
      isActive: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "seller@pharmasys.local" },
    update: {
      name: "بائع تجريبي",
      role: "SELLER",
      passwordHash: sellerPasswordHash,
      isActive: true,
    },
    create: {
      email: "seller@pharmasys.local",
      passwordHash: sellerPasswordHash,
      name: "بائع تجريبي",
      role: "SELLER",
      isActive: true,
    },
  });

  await prisma.customer.upsert({
    where: { phone: "07711111111" },
    update: { name: "زبون تجريبي" },
    create: {
      name: "زبون تجريبي",
      phone: "07711111111",
      notes: "حساب للتجربة",
    },
  });

  console.log(
    `Seeded ${categories.length} categories, ${medicines.length} medicines, settings, customers, and 2 users.`
  );
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
