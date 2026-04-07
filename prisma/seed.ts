import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const adminPassword = await hash("admin123456", 12);
  const orgPassword = await hash("organizer123", 12);
  const userPassword = await hash("user123456", 12);

  const admin = await prisma.user.upsert({
    where: { email: "admin@eventra.app" },
    update: {},
    create: {
      name: "Super Admin",
      email: "admin@eventra.app",
      password: adminPassword,
      role: "ADMIN",
    },
  });

  const organizer1 = await prisma.user.upsert({
    where: { email: "organizer@eventra.app" },
    update: {},
    create: {
      name: "Jane Wanjiru",
      email: "organizer@eventra.app",
      password: orgPassword,
      role: "ORGANIZER",
      organizationName: "Nairobi Events Co.",
      phone: "0712345678",
    },
  });

  const organizer2 = await prisma.user.upsert({
    where: { email: "organizer2@eventra.app" },
    update: {},
    create: {
      name: "Brian Omondi",
      email: "organizer2@eventra.app",
      password: orgPassword,
      role: "ORGANIZER",
      organizationName: "Mombasa Vibes Ltd",
      phone: "0722345678",
    },
  });

  const user1 = await prisma.user.upsert({
    where: { email: "user@eventra.app" },
    update: {},
    create: {
      name: "John Kamau",
      email: "user@eventra.app",
      password: userPassword,
      role: "USER",
      phone: "0733345678",
    },
  });

  await prisma.event.deleteMany({});
  await prisma.commissionRule.deleteMany({});

  await prisma.event.create({
    data: {
      title: "Nairobi Tech Summit 2025",
      description: "The biggest tech conference in East Africa.",
      date: new Date("2025-09-15T09:00:00Z"),
      endDate: new Date("2025-09-16T18:00:00Z"),
      location: "Nairobi, Kenya",
      venue: "KICC",
      status: "PUBLISHED",
      slug: "nairobi-tech-summit-2025",
      organizerId: organizer1.id,
      platformFeePercent: 5,
      ticketTypes: {
        create: [
          {
            category: "REGULAR",
            name: "Regular Access",
            description: "Full 2-day access to all talks",
            price: 2500,
            totalSlots: 500,
            soldCount: 120,
          },
          {
            category: "VIP",
            name: "VIP Access",
            description: "Priority seating, lunch included",
            price: 8500,
            totalSlots: 100,
            soldCount: 35,
          },
          {
            category: "VVIP",
            name: "VVIP Table",
            description: "Reserved table, dinner with speakers",
            price: 25000,
            totalSlots: 20,
            soldCount: 5,
          },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Mombasa Music Festival 2025",
      description: "Three days of incredible live music on the coast.",
      date: new Date("2025-10-03T16:00:00Z"),
      endDate: new Date("2025-10-05T23:00:00Z"),
      location: "Mombasa, Kenya",
      venue: "Bamburi Beach Hotel",
      status: "PUBLISHED",
      slug: "mombasa-music-festival-2025",
      organizerId: organizer2.id,
      platformFeePercent: 5,
      ticketTypes: {
        create: [
          {
            category: "REGULAR",
            name: "General Admission",
            description: "3-day festival pass",
            price: 3500,
            totalSlots: 1000,
            soldCount: 450,
          },
          {
            category: "VIP",
            name: "VIP Pass",
            description: "VIP area, free drinks",
            price: 12000,
            totalSlots: 150,
            soldCount: 60,
          },
        ],
      },
    },
  });

  await prisma.event.create({
    data: {
      title: "Kisumu Startup Pitch Night",
      description: "Watch 10 startups pitch to investors.",
      date: new Date("2025-08-20T18:00:00Z"),
      location: "Kisumu, Kenya",
      venue: "Acacia Premier Hotel",
      status: "PUBLISHED",
      slug: "kisumu-startup-pitch-2025",
      organizerId: organizer1.id,
      platformFeePercent: 5,
      ticketTypes: {
        create: [
          {
            category: "REGULAR",
            name: "Attendee",
            description: "Watch the pitches",
            price: 500,
            totalSlots: 200,
            soldCount: 80,
          },
          {
            category: "VIP",
            name: "Investor Pass",
            description: "Front row, pre-event dinner",
            price: 5000,
            totalSlots: 30,
            soldCount: 12,
          },
        ],
      },
    },
  });

  await prisma.commissionRule.create({
    data: {
      name: "Default",
      feePercent: 5.0,
      feeFixed: 0,
      isDefault: true,
    },
  });

  console.log("Seeded successfully:");
  console.log("  Admin:      admin@eventra.app / admin123456");
  console.log("  Organizer:  organizer@eventra.app / organizer123");
  console.log("  Organizer2: organizer2@eventra.app / organizer123");
  console.log("  User:       user@eventra.app / user123456");
  console.log("  Events:     3 published events created");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
