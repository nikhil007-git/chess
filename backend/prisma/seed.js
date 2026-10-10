import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Initializing database with Admin user...');

  const adminUsername = 'admin';
  const adminPassword = 'adminpassword123';
  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.admin.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log(`✓ Admin account ready: ${admin.username} (Password: ${adminPassword})`);
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
