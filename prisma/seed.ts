import { PrismaClient, Role } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Seeding EDN Backend database...\n');
  // ── ADMIN USER ───────────────────────────────────
  const hashedPassword = await bcrypt.hash('Pr0d1gy.967**', 12);

  await prisma.user.create({
    data: {
      username: 'calitoalejandro184',
      email: 'calitoalejandro184@gmail.com',
      password: hashedPassword,
      role: Role.ADMIN,
    },
  });

  console.log('✅ Created admin user');
  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Admin credentials:');
  console.log('   Username: calitoalejandro184');
  console.log('   Password: Pr0d1gy.967**\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
