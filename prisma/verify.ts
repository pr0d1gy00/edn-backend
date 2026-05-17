import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });

async function verify() {
  const users = await prisma.user.findMany({ select: { username: true, email: true, role: true } });
  const guests = await prisma.guest.findMany({ select: { name: true } });
  const episodes = await prisma.episode.findMany({ select: { episodeNumber: true, title: true } });
  const tours = await prisma.tourShow.findMany({ select: { city: true, country: true } });
  const stories = await prisma.communityStory.findMany({ select: { title: true, isApproved: true } });
  const media = await prisma.media.findMany({ select: { entityType: true, url: true } });

  console.log('=== USERS (' + users.length + ') ===');
  users.forEach(u => console.log(' ', u.username, '|', u.email, '|', u.role));

  console.log('=== GUESTS (' + guests.length + ') ===');
  guests.forEach(g => console.log(' ', g.name));

  console.log('=== EPISODES (' + episodes.length + ') ===');
  episodes.forEach(e => console.log(' ', e.episodeNumber, '|', e.title));

  console.log('=== TOUR SHOWS (' + tours.length + ') ===');
  tours.forEach(t => console.log(' ', t.city, '|', t.country));

  console.log('=== STORIES (' + stories.length + ') ===');
  stories.forEach(s => console.log(' ', s.title, '| approved:', s.isApproved));

  console.log('=== MEDIA (' + media.length + ') ===');
  media.forEach(m => console.log(' ', m.entityType, '|', m.url));

  await prisma.$disconnect();
}

verify().catch(e => { console.error(e); process.exit(1); });