// scripts/test-event.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function testEventCreation() {
  console.log("🧪 Starting isolated event creation test...\n");

  // 1️⃣ Verify DB connection
  try {
    await prisma.$connect();
    console.log("✅ Database connected successfully\n");
  } catch (err: any) {
    console.error("❌ DB Connection failed:", err.message);
    process.exit(1);
  }

  try {
    // 2️⃣ Find a real organizer to link the event to
    const user = await prisma.user.findFirst({
      where: { role: "ORGANIZER" },
      select: { id: true, email: true },
    });

    if (!user) {
      console.warn("⚠️  No ORGANIZER user found in DB.");
      console.log("👉 Please create an organizer user first, or update this script with a valid ID.");
      return;
    }
    console.log(`👤 Using organizer: ${user.email} (${user.id})\n`);

    // 3️⃣ Mock payload matching your form
    const now = new Date();
    const testEvent = {
      title: `Test Event ${now.toISOString().slice(0, 10)}`,
      description: "Created by automated test script",
      date: new Date("2026-12-25T18:00:00.000Z"),
      location: "Nairobi, Kenya",
      venue: "Virtual Test Hall",
      slug: `test-event-${Math.floor(Math.random() * 10000)}`,
      organizerId: user.id,
      // ⚠️ Remove 'status' if your Event model doesn't have it
      status: "DRAFT", 
    };

    const testTickets = [
      {
        name: "Early Bird",
        category: "REGULAR",
        price: 500,
        currency: "KES",
        totalSlots: 50,
        soldCount: 0,
        isActive: true,
        maxPerOrder: 5,
      },
    ];

    console.log("📝 Attempting Prisma transaction...\n");

    // 4️⃣ Run the exact same logic as your API route
    const result = await prisma.$transaction(async (tx) => {
      // Create Event
      const event = await tx.event.create({
        data: {
          ...testEvent,
        },
      });
      console.log(`✅ Event created: ${event.id}`);

      // Create Ticket Types
      for (const tt of testTickets) {
        await tx.ticketType.create({
          data: {
            eventId: event.id,
            ...tt,
          },
        });
        console.log(`🎟️  Ticket type added: ${tt.name}`);
      }

      return event;
    });

    console.log("\n🎉 SUCCESS! Test event created.");
    console.log("🔗 ID:", result.id);
    console.log("🏷️  Title:", result.title);

  } catch (error: any) {
    console.error("\n❌ TEST FAILED!");
    console.error("📛 Error Code:", error.code || "N/A");
    console.error("📛 Error Name:", error.name || "N/A");
    console.error("📝 Message:", error.message);
    if (error.meta) {
      console.error("💡 Prisma Meta:", JSON.stringify(error.meta, null, 2));
    }
    if (error.stack) {
      console.error("📄 Stack (first 5 lines):", error.stack.split("\n").slice(0, 5).join("\n"));
    }
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 DB connection closed.");
  }
}

// Run test
testEventCreation();