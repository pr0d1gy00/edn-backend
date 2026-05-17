import { PrismaClient, PlatformType, TicketStatus, MediaEntityType, Role } from '@prisma/client';
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

// Helpers
const generateId = (prefix: string, index: number) => `${prefix}0000000-0000-4000-8000-0000000000${index.toString(16).padStart(2, '0')}`;

async function main() {
  console.log('🌱 Seeding EDN Backend database with MASSIVE data...\n');

  // ── Clean existing data ──────────────────────
  await prisma.storyVote.deleteMany();
  await prisma.insideJoke.deleteMany();
  await prisma.media.deleteMany();
  await prisma.communityStory.deleteMany();
  await prisma.storyPrompt.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.tourShow.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleaned existing data');

  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword  = await bcrypt.hash('User123!', 12);

  // ── USERS (15) ───────────────────────────────────
  const usersData = Array.from({ length: 15 }).map((_, i) => ({
    id: i === 0 ? 'a0000000-0000-4000-8000-000000000001' : generateId('a', i + 1),
    username: i === 0 ? 'admin' : `user_${i}`,
    email: i === 0 ? 'admin@esdenita.com' : `user${i}@esdenita.com`,
    password: i === 0 ? adminPassword : userPassword,
    role: i === 0 ? Role.ADMIN : Role.USER,
    avatarUrl: `https://picsum.photos/seed/user${i}/200/200`,
  }));
  await prisma.user.createMany({ data: usersData });
  console.log(`✅ Created ${usersData.length} users`);

  // ── GUESTS (15) ───────────────────────────────────
  const guestsData = Array.from({ length: 15 }).map((_, i) => ({
    id: generateId('b', i + 1),
    name: `Guest ${i + 1}`,
    bio: `Bio descriptiva del invitado ${i + 1}. Creador de contenido, artista o amigo de la casa con anécdotas increíbles.`,
    twitterHandle: `guest${i + 1}_tw`,
    instagramHandle: `guest${i + 1}_ig`,
  }));
  await prisma.guest.createMany({ data: guestsData });
  console.log(`✅ Created ${guestsData.length} guests`);

  // ── EPISODES (20) ─────────────────────────────────
  const platformTypes = [PlatformType.YOUTUBE, PlatformType.SPOTIFY, PlatformType.PATREON];
  const episodesData = Array.from({ length: 20 }).map((_, i) => ({
    id: generateId('c', i + 1),
    episodeNumber: 100 - i,
    title: `Episode ${100 - i}: Gran invitado especial y anécdotas locas`,
    description: `Descripción detallada del episodio ${100 - i}. Hablamos sobre temas variados, la vida, anécdotas del internet y mucho más. Un episodio para el recuerdo.`,
    platformType: platformTypes[i % platformTypes.length],
    contentUrl: `https://example.com/episode/${100 - i}`,
    thumbnailUrl: `https://picsum.photos/seed/episode${100 - i}/800/450`,
    publishedAt: new Date(Date.now() - i * 7 * 24 * 60 * 60 * 1000), // back in time
    isExclusive: i % 4 === 0,
    durationSeconds: 3000 + (i * 100),
  }));
  await prisma.episode.createMany({ data: episodesData });
  console.log(`✅ Created ${episodesData.length} episodes`);

  // ── EPISODE-GUEST RELATIONSHIPS ─────────────
  // Assign 1-2 guests to each episode
  const relations: string[] = [];
  episodesData.forEach((ep, i) => {
    const guest1 = guestsData[i % guestsData.length].id;
    relations.push(`('${ep.id}', '${guest1}')`);
    if (i % 3 === 0) { // Every third episode gets two guests
      const guest2 = guestsData[(i + 1) % guestsData.length].id;
      relations.push(`('${ep.id}', '${guest2}')`);
    }
  });
  if (relations.length > 0) {
    await prisma.$executeRawUnsafe(`
      INSERT INTO "_EpisodeGuests" ("A", "B") VALUES
      ${relations.join(', ')}
    `);
  }
  console.log(`✅ Linked episodes ↔ guests (${relations.length} connections)`);

  // ── INSIDE JOKES (20) ──────────────────────────────
  const jokesData = Array.from({ length: 20 }).map((_, i) => ({
    id: generateId('f', i + 1),
    episodeId: episodesData[i % episodesData.length].id,
    startTimeStamp: `00:${String(10 + i).padStart(2, '0')}:00`,
    endTimeStamp: `00:${String(12 + i).padStart(2, '0')}:00`,
    keyConcept: `Chiste interno legendario #${i + 1}`,
    transcriptContext: `Este es el contexto detallado de cómo surgió el chiste interno #${i + 1} durante la grabación del episodio. Un momento verdaderamente hilarante.`,
  }));
  await prisma.insideJoke.createMany({ data: jokesData });
  console.log(`✅ Created ${jokesData.length} inside jokes`);

  // ── TOUR SHOWS (15) ────────────────────────────────
  const cities = ['Buenos Aires', 'CDMX', 'Madrid', 'Bogotá', 'Santiago', 'Lima', 'Miami', 'NY', 'Barcelona', 'Montevideo', 'Caracas', 'Medellín', 'Valencia', 'Guadalajara', 'Monterrey'];
  const countries = ['Argentina', 'México', 'España', 'Colombia', 'Chile', 'Perú', 'USA', 'USA', 'España', 'Uruguay', 'Venezuela', 'Colombia', 'España', 'México', 'México'];
  const ticketStatuses = [TicketStatus.AVAILABLE, TicketStatus.FEW_TICKETS, TicketStatus.SOLD_OUT];
  const tourData = Array.from({ length: 15 }).map((_, i) => ({
    id: generateId('d', i + 1),
    city: cities[i],
    country: countries[i],
    venueName: `Teatro Gran ${cities[i]}`,
    showDate: new Date(Date.now() + (i + 1) * 14 * 24 * 60 * 60 * 1000), // future dates
    ticketUrl: `https://ticketera.com/edn-${cities[i].toLowerCase().replace(' ', '-')}`,
    ticketStatus: ticketStatuses[i % ticketStatuses.length],
    latitude: -34.0 + (i * 2.5), // Mock coordinates
    longitude: -58.0 + (i * 2.5),
  }));
  await prisma.tourShow.createMany({ data: tourData });
  console.log(`✅ Created ${tourData.length} tour shows`);

  // ── STORY PROMPTS (6) ─────────────────────────
  const storyPromptsData = [
    {
      id: generateId('3', 1),
      title: 'Cuéntanos tu historia más divertida',
      description: 'Comparte la anécdota más graciosa que hayas vivido recientemente',
      isOpen: true,
      isPublic: true,
      opensAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      closesAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
    },
    {
      id: generateId('3', 2),
      title: 'Momentos incómodos en el trabajo',
      description: 'Esa situación laboral que no sabes si reír o llorar',
      isOpen: true,
      isPublic: false,
      opensAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
      closesAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId('3', 3),
      title: 'Fails épicos en citas',
      description: 'Lo peor que te ha pasado en una cita romántica',
      isOpen: false,
      isPublic: true,
      opensAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      closesAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    },
    {
      id: generateId('3', 4),
      title: 'La vez que casi muero de vergüenza',
      description: 'Historias de vergüenza ajena nivel experto',
      isOpen: true,
      isPublic: false,
      opensAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      closesAt: null,
    },
    {
      id: generateId('3', 5),
      title: 'Encuentros random con famosos',
      description: '¿Te encontraste con alguien famoso en el lugar más inesperado?',
      isOpen: true,
      isPublic: true,
      opensAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      closesAt: null,
    },
    {
      id: generateId('3', 6),
      title: 'Desastres culinarios',
      description: 'Cuando la cocina se convierte en zona de desastre',
      isOpen: false,
      isPublic: false,
      opensAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      closesAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
  ];
  await prisma.storyPrompt.createMany({ data: storyPromptsData });
  console.log(`✅ Created ${storyPromptsData.length} story prompts`);

  // ── COMMUNITY STORIES (25) ───────────────────────
  const storiesData = Array.from({ length: 25 }).map((_, i) => ({
    id: generateId('e', i + 1),
    userId: i % 3 === 0 ? null : usersData[(i % (usersData.length - 1)) + 1].id, // 1/3 anonymous, 2/3 authenticated
    title: `Historia loca de la comunidad #${i + 1}`,
    content: `Esta es la historia detallada número ${i + 1}. Me pasó algo muy gracioso y fuera de contexto, así que lo quería compartir con la comunidad de EDN. Sucedió hace un par de semanas y no me lo puedo sacar de la cabeza.`,
    promptId: storyPromptsData[i % storyPromptsData.length].id,
    submittedAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
    isApproved: i % 5 !== 0, // 80% approved
  }));
  await prisma.communityStory.createMany({ data: storiesData });
  console.log(`✅ Created ${storiesData.length} community stories`);

  // ── STORY VOTES (40) ──────────────────────────────
  const votesData = Array.from({ length: 40 }).map((_, i) => ({
    userId: usersData[(i % (usersData.length - 1)) + 1].id, // only authenticated users can vote
    storyId: storiesData[i % storiesData.length].id,
    voteValue: i % 4 === 0 ? -1 : 1, // 75% positive votes, 25% negative
  }));
  // Filter unique combinations
  const uniqueVotesData = votesData.filter((v, i, a) => a.findIndex(t => (t.userId === v.userId && t.storyId === v.storyId)) === i);
  await prisma.storyVote.createMany({ data: uniqueVotesData });
  console.log(`✅ Created ${uniqueVotesData.length} story votes`);

  // ── MEDIA (20 images for episodes, 15 for tours) ─────────────────────
  const episodeMediaData = Array.from({ length: 20 }).map((_, i) => ({
    id: generateId('1', i + 1),
    entityType: MediaEntityType.EPISODE,
    entityId: episodesData[i].id,
    url: `https://picsum.photos/seed/epmedia${i}/1200/675`,
    key: `media/episodes/ep-media-${i}.jpg`,
    isPrimary: true,
    sortOrder: 0,
  }));
  
  const tourMediaData = Array.from({ length: 15 }).map((_, i) => ({
    id: generateId('2', i + 1),
    entityType: MediaEntityType.TOUR_SHOW,
    entityId: tourData[i].id,
    url: `https://picsum.photos/seed/tourmedia${i}/1200/800`,
    key: `media/tours/tour-media-${i}.jpg`,
    isPrimary: true,
    sortOrder: 0,
  }));
  
  await prisma.media.createMany({ data: [...episodeMediaData, ...tourMediaData] });
  console.log(`✅ Created ${episodeMediaData.length + tourMediaData.length} media items`);

  console.log('\n🎉 Seeding complete with massive data!\n');
  console.log('📋 Credentials to login:');
  console.log('   Username: admin');
  console.log('   Password: Admin123!');
  console.log('   Role: ADMIN\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });