import { PrismaPg } from "@prisma/adapter-pg";
import { passwordHash } from "../../helpers/passwordHashing.js";
import { prisma } from "../../lib/prisma.js";
const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

async function main() {
  console.log("Starting seed...");
  const hashedPassword = await passwordHash("Password@123");

  const user = await prisma.user.upsert({
    where: { email: "demo@example.com" },
    update: {},
    create: {
      email: "demo@example.com",
      firstName: "Demo",
      lastName: "User",
      password: hashedPassword,
    },
  });

  console.log("Created User:", user.id);

  const workspace = await prisma.workspace.create({
    data: {
      name: "Subtend Demo HQ",
      members: {
        create: {
          userId: user.id,
          role: "ADMIN",
        },
      },
    },
  });

  console.log("Created Workspace:", workspace.id);

  await prisma.status.createMany({
    data: [
      {
        name: "To-Do",
        color: "#6b7280",
        isDefault: true,
        order: 1,
        workspaceId: workspace.id,
      },
      {
        name: "In Progress",
        color: "#2563eb",
        isDefault: false,
        order: 2,
        workspaceId: workspace.id,
      },
      {
        name: "Done",
        color: "#16a34a",
        isDefault: false,
        order: 3,
        workspaceId: workspace.id,
      },
      {
        name: "Canceled",
        color: "#f59e0b",
        isDefault: false,
        order: 4,
        workspaceId: workspace.id,
      },
    ],
  });

  console.log("Default statuses created for the demo workspace.");
}
main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
