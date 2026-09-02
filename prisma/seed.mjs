import { PrismaClient } from "@prisma/client";

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
    expiryDate: "2028-02-29",
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
  },
];

async function main() {
  const categoryIds = new Map();

  for (const category of categories) {
    const saved = await prisma.category.upsert({
      where: { name: category.name },
      update: {},
      create: category,
    });
    categoryIds.set(category.name, saved.id);
  }

  for (const medicine of medicines) {
    const { category, quantity, expiryDate, ...medicineData } = medicine;
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
        data: { quantity },
      });
    } else {
      await prisma.batch.create({
        data: {
          medicineId: saved.id,
          quantity,
          expiryDate: new Date(expiryDate),
        },
      });
    }
  }

  await prisma.user.upsert({
    where: { phone: "9647700000001" },
    update: { name: "مدير النظام", role: "ADMIN", phoneVerified: new Date() },
    create: {
      phone: "9647700000001",
      name: "مدير النظام",
      role: "ADMIN",
      phoneVerified: new Date(),
    },
  });

  await prisma.user.upsert({
    where: { phone: "9647700000002" },
    update: { name: "بائع تجريبي", role: "SELLER", phoneVerified: new Date() },
    create: {
      phone: "9647700000002",
      name: "بائع تجريبي",
      role: "SELLER",
      phoneVerified: new Date(),
    },
  });

  console.log(`Seeded ${categories.length} categories, ${medicines.length} medicines, and 2 users.`);
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });