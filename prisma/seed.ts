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

// ──────────────────────────────────────────────
// UUIDs (solo chars hex válidos: 0-9 a-f)
// ──────────────────────────────────────────────
// Users
const ADMIN_ID  = 'a0000000-0000-4000-8000-000000000001';
const USER_1_ID  = 'a0000000-0000-4000-8000-000000000002';
const USER_2_ID  = 'a0000000-0000-4000-8000-000000000003';
const USER_3_ID  = 'a0000000-0000-4000-8000-000000000004';

// Guests (5)
const GUEST_1_ID = 'b0000000-0000-4000-8000-000000000001';
const GUEST_2_ID = 'b0000000-0000-4000-8000-000000000002';
const GUEST_3_ID = 'b0000000-0000-4000-8000-000000000003';
const GUEST_4_ID = 'b0000000-0000-4000-8000-000000000004';
const GUEST_5_ID = 'b0000000-0000-4000-8000-000000000005';

// Episodes (6)
const EPISODE_1_ID = 'c0000000-0000-4000-8000-000000000001';
const EPISODE_2_ID = 'c0000000-0000-4000-8000-000000000002';
const EPISODE_3_ID = 'c0000000-0000-4000-8000-000000000003';
const EPISODE_4_ID = 'c0000000-0000-4000-8000-000000000004';
const EPISODE_5_ID = 'c0000000-0000-4000-8000-000000000005';
const EPISODE_6_ID = 'c0000000-0000-4000-8000-000000000006';

// Tour Shows (5)
const TOUR_1_ID = 'd0000000-0000-4000-8000-000000000001';
const TOUR_2_ID = 'd0000000-0000-4000-8000-000000000002';
const TOUR_3_ID = 'd0000000-0000-4000-8000-000000000003';
const TOUR_4_ID = 'd0000000-0000-4000-8000-000000000004';
const TOUR_5_ID = 'd0000000-0000-4000-8000-000000000005';

// Stories (5)
const STORY_1_ID = 'e0000000-0000-4000-8000-000000000001';
const STORY_2_ID = 'e0000000-0000-4000-8000-000000000002';
const STORY_3_ID = 'e0000000-0000-4000-8000-000000000003';
const STORY_4_ID = 'e0000000-0000-4000-8000-000000000004';
const STORY_5_ID = 'e0000000-0000-4000-8000-000000000005';

// Inside Jokes (3)
const JOKE_1_ID = 'f0000000-0000-4000-8000-000000000001';
const JOKE_2_ID = 'f0000000-0000-4000-8000-000000000002';
const JOKE_3_ID = 'f0000000-0000-4000-8000-000000000003';

// Media (10 imágenes)
const MEDIA_EP1_ID    = '10000000-0000-4000-8000-000000000001';
const MEDIA_EP2_ID    = '10000000-0000-4000-8000-000000000002';
const MEDIA_EP3_ID    = '10000000-0000-4000-8000-000000000003';
const MEDIA_EP4_ID    = '10000000-0000-4000-8000-000000000004';
const MEDIA_EP5_ID    = '10000000-0000-4000-8000-000000000005';
const MEDIA_TOUR1_ID  = '20000000-0000-4000-8000-000000000001';
const MEDIA_TOUR2_ID  = '20000000-0000-4000-8000-000000000002';
const MEDIA_TOUR3_ID  = '20000000-0000-4000-8000-000000000003';
const MEDIA_TOUR4_ID  = '20000000-0000-4000-8000-000000000004';
const MEDIA_TOUR5_ID  = '20000000-0000-4000-8000-000000000005';

async function main() {
  console.log('🌱 Seeding EDN Backend database...\n');

  // ── Clean existing data ──────────────────────
  await prisma.storyVote.deleteMany();
  await prisma.insideJoke.deleteMany();
  await prisma.media.deleteMany();
  await prisma.communityStory.deleteMany();
  await prisma.episode.deleteMany();
  await prisma.guest.deleteMany();
  await prisma.tourShow.deleteMany();
  await prisma.user.deleteMany();
  console.log('✅ Cleaned existing data');

  // ── Hash passwords ───────────────────────────
  const adminPassword = await bcrypt.hash('Admin123!', 12);
  const userPassword  = await bcrypt.hash('User123!', 12);

  // ── USERS ───────────────────────────────────
  await prisma.user.createMany({
    data: [
      {
        id: ADMIN_ID,
        username: 'admin',
        email: 'admin@esdenita.com',
        password: adminPassword,
        role: Role.ADMIN,
        avatarUrl: 'https://picsum.photos/seed/admin-avatar/200/200',
      },
      {
        id: USER_1_ID,
        username: 'luisito',
        email: 'luisito@esdenita.com',
        password: userPassword,
        role: Role.USER,
        avatarUrl: 'https://picsum.photos/seed/luisito-avatar/200/200',
      },
      {
        id: USER_2_ID,
        username: 'juani',
        email: 'juani@esdenita.com',
        password: userPassword,
        role: Role.USER,
        avatarUrl: 'https://picsum.photos/seed/juani-avatar/200/200',
      },
      {
        id: USER_3_ID,
        username: 'chico',
        email: 'chico@esdenita.com',
        password: userPassword,
        role: Role.USER,
        avatarUrl: 'https://picsum.photos/seed/chico-avatar/200/200',
      },
    ],
  });
  console.log('✅ Created 4 users (admin + 3 users)');

  // ── GUESTS ───────────────────────────────────
  await prisma.guest.createMany({
    data: [
      {
        id: GUEST_1_ID,
        name: 'MrBeast',
        bio: 'Youtuber, filántropo y empresario. Known por sus videos de desafíos extremos y donaciones a causas importantes.',
        twitterHandle: 'MrBeast',
        instagramHandle: 'mrbeast',
      },
      {
        id: GUEST_2_ID,
        name: 'Luisito Communications',
        bio: 'Creador de contenido mexicano, conocido por sus videos de viajes, gastronomía y crítica constructiva.',
        twitterHandle: 'luisitocomunica',
        instagramHandle: 'luisitocomunica',
      },
      {
        id: GUEST_3_ID,
        name: 'Chico Groove',
        bio: 'Músico y creador de contenido. Una de las voces más auténticas de la generación Z.',
        twitterHandle: 'chicogroove',
        instagramHandle: 'chicogroove',
      },
      {
        id: GUEST_4_ID,
        name: 'Dross',
        bio: 'Creador de contenido, escritor y filósofo moderno. Conocido por sus reflexiones sobre la vida y el universo.',
        twitterHandle: 'drossrotz',
        instagramHandle: 'drossrotz',
      },
      {
        id: GUEST_5_ID,
        name: 'Vegetta777',
        bio: 'Youtuber español de gaming y contenido variado. Uno de los creadores más influyentes de habla hispana.',
        twitterHandle: 'Vegetta777',
        instagramHandle: 'vegetta777',
      },
    ],
  });
  console.log('✅ Created 5 guests');

  // ── EPISODES ─────────────────────────────────
  await prisma.episode.createMany({
    data: [
      {
        id: EPISODE_1_ID,
        episodeNumber: 100,
        title: 'El Podcast 100: MrBeast Live desde su estudio',
        description: 'Episodio histórico celebrando los 100 episodios de Esdenita. MrBeast se une para una conversación épica sobre filantropía, Youtube y el futuro del contenido.',
        platformType: PlatformType.YOUTUBE,
        contentUrl: 'https://www.youtube.com/watch?v=abc100',
        thumbnailUrl: 'https://picsum.photos/seed/episode100/800/450',
        publishedAt: new Date('2026-01-15'),
        isExclusive: false,
        durationSeconds: 5400,
      },
      {
        id: EPISODE_2_ID,
        episodeNumber: 99,
        title: 'Episode 99: Luisito Returns — Viaje a Tokio',
        description: 'Luisito regresa a Esdenita para contarnos todo sobre su último viaje a Japón. Comida, cultura y muchos insights.',
        platformType: PlatformType.YOUTUBE,
        contentUrl: 'https://www.youtube.com/watch?v=abc99',
        thumbnailUrl: 'https://picsum.photos/seed/episode99/800/450',
        publishedAt: new Date('2026-01-08'),
        isExclusive: false,
        durationSeconds: 4800,
      },
      {
        id: EPISODE_3_ID,
        episodeNumber: 98,
        title: 'Episode 98: Chico Groove — La Generación Z Habla',
        description: 'Chico Groove se sienta con nosotros para hablar sobre la escena musical actual, la presión de las redes sociales y su nuevo álbum.',
        platformType: PlatformType.SPOTIFY,
        contentUrl: 'https://open.spotify.com/episode/abc98',
        thumbnailUrl: 'https://picsum.photos/seed/episode98/800/450',
        publishedAt: new Date('2025-12-20'),
        isExclusive: false,
        durationSeconds: 3600,
      },
      {
        id: EPISODE_4_ID,
        episodeNumber: 97,
        title: 'Episode 97: Dross — El Filósofo Moderno',
        description: 'Dross llega con su profundidad característica para hablar sobre existencialismo, la soledad creativa y cómo ser feliz en el mundo actual.',
        platformType: PlatformType.PATREON,
        contentUrl: 'https://www.patreon.com/posts/episodio-97',
        thumbnailUrl: 'https://picsum.photos/seed/episode97/800/450',
        publishedAt: new Date('2025-12-10'),
        isExclusive: true,
        durationSeconds: 4200,
      },
      {
        id: EPISODE_5_ID,
        episodeNumber: 96,
        title: 'Episode 96: Vegetta777 — Gaming y Filosofía',
        description: 'Vegetta777 habla sobre cómo llegó a ser uno de los mayores creadores de contenido en español, sus juegos favoritos y la comunidad hispanohablante.',
        platformType: PlatformType.YOUTUBE,
        contentUrl: 'https://www.youtube.com/watch?v=abc96',
        thumbnailUrl: 'https://picsum.photos/seed/episode96/800/450',
        publishedAt: new Date('2025-11-28'),
        isExclusive: false,
        durationSeconds: 5100,
      },
      {
        id: EPISODE_6_ID,
        episodeNumber: null,
        title: 'Special: Trip a CDMX — Detrás de Cámaras',
        description: 'Mini-clip especial con los mejores momentos de nuestro viaje a Ciudad de México. Incluye escenas eliminadas y bloopers.',
        platformType: PlatformType.YOUTUBE,
        contentUrl: 'https://www.youtube.com/watch?v=abc-special1',
        thumbnailUrl: 'https://picsum.photos/seed/episode-special/800/450',
        publishedAt: new Date('2025-11-15'),
        isExclusive: false,
        durationSeconds: 900,
      },
    ],
  });
  console.log('✅ Created 6 episodes (5 numbered + 1 special)');

  // ── EPISODE-GUEST RELATIONSHIPS ─────────────
  await prisma.$executeRawUnsafe(`
    INSERT INTO "_EpisodeGuests" ("A", "B") VALUES
    ('${EPISODE_1_ID}', '${GUEST_1_ID}'),
    ('${EPISODE_2_ID}', '${GUEST_2_ID}'),
    ('${EPISODE_3_ID}', '${GUEST_3_ID}'),
    ('${EPISODE_4_ID}', '${GUEST_4_ID}'),
    ('${EPISODE_5_ID}', '${GUEST_5_ID}'),
    ('${EPISODE_1_ID}', '${GUEST_2_ID}')
  `);
  console.log('✅ Linked episodes ↔ guests');

  // ── INSIDE JOKES ──────────────────────────────
  await prisma.insideJoke.createMany({
    data: [
      {
        id: JOKE_1_ID,
        episodeId: EPISODE_1_ID,
        startTimeStamp: '00:14:23',
        endTimeStamp: '00:16:45',
        keyConcept: 'Chupis',
        transcriptContext: 'Cuando Juani menciona que le gustaría probar las Chupis en el oxxo a las 3am',
      },
      {
        id: JOKE_2_ID,
        episodeId: EPISODE_1_ID,
        startTimeStamp: '00:45:10',
        endTimeStamp: '00:48:30',
        keyConcept: "Leo's Deodorant",
        transcriptContext: "Leo saca su desodorante favorito y dice que es su 'talismán' antes de cada podcast",
      },
      {
        id: JOKE_3_ID,
        episodeId: EPISODE_2_ID,
        startTimeStamp: '00:22:00',
        endTimeStamp: '00:25:15',
        keyConcept: 'Sushi Japonés',
        transcriptContext: "Luisito explica por qué el sushi en Tokio es mejor que en México, y Juani no está de acuerdo",
      },
    ],
  });
  console.log('✅ Created 3 inside jokes');

  // ── TOUR SHOWS ────────────────────────────────
  await prisma.tourShow.createMany({
    data: [
      {
        id: TOUR_1_ID,
        city: 'Buenos Aires',
        country: 'Argentina',
        venueName: 'Teatro Gran Rex',
        showDate: new Date('2026-03-20T21:00:00Z'),
        ticketUrl: 'https://ticketera.com/edn-ba',
        ticketStatus: TicketStatus.AVAILABLE,
        latitude: -34.603723,
        longitude: -58.383591,
      },
      {
        id: TOUR_2_ID,
        city: 'Ciudad de México',
        country: 'México',
        venueName: 'Auditorio Nacional',
        showDate: new Date('2026-04-05T20:00:00Z'),
        ticketUrl: 'https://ticketera.com/edn-cdmx',
        ticketStatus: TicketStatus.FEW_TICKETS,
        latitude: 19.432608,
        longitude: -99.133209,
      },
      {
        id: TOUR_3_ID,
        city: 'Madrid',
        country: 'España',
        venueName: 'WiZink Center',
        showDate: new Date('2026-04-18T21:00:00Z'),
        ticketUrl: 'https://ticketera.com/edn-madrid',
        ticketStatus: TicketStatus.AVAILABLE,
        latitude: 40.423089,
        longitude: -3.671782,
      },
      {
        id: TOUR_4_ID,
        city: 'Bogotá',
        country: 'Colombia',
        venueName: 'Ágora Bogotá',
        showDate: new Date('2026-05-02T20:30:00Z'),
        ticketUrl: 'https://ticketera.com/edn-bogota',
        ticketStatus: TicketStatus.AVAILABLE,
        latitude: 4.711025,
        longitude: -74.072092,
      },
      {
        id: TOUR_5_ID,
        city: 'São Paulo',
        country: 'Brasil',
        venueName: 'Arena SP',
        showDate: new Date('2026-05-15T21:00:00Z'),
        ticketUrl: 'https://ticketera.com/edn-sp',
        ticketStatus: TicketStatus.SOLD_OUT,
        latitude: -23.550593,
        longitude: -46.633386,
      },
    ],
  });
  console.log('✅ Created 5 tour shows');

  // ── COMMUNITY STORIES ───────────────────────
  await prisma.communityStory.createMany({
    data: [
      {
        id: STORY_1_ID,
        userId: USER_1_ID,
        title: 'Mi peor cita fue en un funeral',
        content: 'Resulta que mi cita del app me llevó a lo que creía era una boda. Resulta ser el funeral de su ex. Cuando llegué estaba el féretro en el salón. La comida era excelente.',
        category: 'Bad dates',
        submittedAt: new Date('2026-01-10'),
        isApproved: true,
      },
      {
        id: STORY_2_ID,
        userId: USER_2_ID,
        title: 'Esa vez que me quedé dormido en el uber',
        content: 'Me dormí en el uber después de la prepa y desperté en Pachuca. Eran las 4am. El conductor me dijo que llevaba 2 horas hablando conmigo. Le creí.',
        category: 'Awkward moments',
        submittedAt: new Date('2026-01-12'),
        isApproved: true,
      },
      {
        id: STORY_3_ID,
        userId: null, // anonymous
        title: 'Le mandé screenshot de mi ex a mi mamá por error',
        content: 'Estaba mandándole un screenshot a mi amiga sobre lo loco que estaba mi ex. Mi mamá estaba al lado. Ahora thinks que sigo con él. A la fecha no me deja en paz.',
        category: 'Awkward moments',
        submittedAt: new Date('2026-01-14'),
        isApproved: true,
      },
      {
        id: STORY_4_ID,
        userId: USER_3_ID,
        title: 'Fui a trabajar sin pantalón',
        content: 'Me desperté tarde, me vestí con prisas en la oscuridad. Cuando llegué a la oficina me di cuenta que estaba en calcetas. Tuve que pedirle prestada una falda a mi compañera.',
        category: 'Bad dates',
        submittedAt: new Date('2026-01-15'),
        isApproved: true,
      },
      {
        id: STORY_5_ID,
        userId: null, // anonymous
        title: 'Le confesé mis sentimientos a mi crush en el grupo de la uni',
        content: 'Le mandé un audio de 5 minutos diciéndole que me gustaba. Lo mandé al grupo de la universidad completo. 300 personas听到 todo. Ahora está trending en twitter.',
        category: 'Bad dates',
        submittedAt: new Date('2026-01-16'),
        isApproved: true,
      },
    ],
  });
  console.log('✅ Created 5 community stories (approved)');

  // ── STORY VOTES ──────────────────────────────
  await prisma.storyVote.createMany({
    data: [
      { userId: USER_2_ID, storyId: STORY_1_ID, voteValue: 1 },
      { userId: USER_3_ID, storyId: STORY_1_ID, voteValue: 1 },
      { userId: USER_1_ID, storyId: STORY_2_ID, voteValue: 1 },
      { userId: USER_2_ID, storyId: STORY_3_ID, voteValue: -1 },
      { userId: USER_1_ID, storyId: STORY_4_ID, voteValue: 1 },
      { userId: USER_3_ID, storyId: STORY_5_ID, voteValue: 1 },
    ],
  });
  console.log('✅ Created 6 story votes');

  // ── MEDIA (episode images) ─────────────────────
  await prisma.media.createMany({
    data: [
      {
        id: MEDIA_EP1_ID,
        entityType: MediaEntityType.EPISODE,
        entityId: EPISODE_1_ID,
        url: 'https://picsum.photos/seed/ep1-thumb/1200/675',
        key: 'media/episodes/ep1-thumb.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_EP2_ID,
        entityType: MediaEntityType.EPISODE,
        entityId: EPISODE_2_ID,
        url: 'https://picsum.photos/seed/ep2-thumb/1200/675',
        key: 'media/episodes/ep2-thumb.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_EP3_ID,
        entityType: MediaEntityType.EPISODE,
        entityId: EPISODE_3_ID,
        url: 'https://picsum.photos/seed/ep3-thumb/1200/675',
        key: 'media/episodes/ep3-thumb.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_EP4_ID,
        entityType: MediaEntityType.EPISODE,
        entityId: EPISODE_4_ID,
        url: 'https://picsum.photos/seed/ep4-thumb/1200/675',
        key: 'media/episodes/ep4-thumb.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_EP5_ID,
        entityType: MediaEntityType.EPISODE,
        entityId: EPISODE_5_ID,
        url: 'https://picsum.photos/seed/ep5-thumb/1200/675',
        key: 'media/episodes/ep5-thumb.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  });
  console.log('✅ Created 5 episode images');

  // ── MEDIA (tour show images) ───────────────────
  await prisma.media.createMany({
    data: [
      {
        id: MEDIA_TOUR1_ID,
        entityType: MediaEntityType.TOUR_SHOW,
        entityId: TOUR_1_ID,
        url: 'https://picsum.photos/seed/tour-ba-venue/1200/800',
        key: 'media/tours/tour-ba-venue.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_TOUR2_ID,
        entityType: MediaEntityType.TOUR_SHOW,
        entityId: TOUR_2_ID,
        url: 'https://picsum.photos/seed/tour-cdmx-venue/1200/800',
        key: 'media/tours/tour-cdmx-venue.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_TOUR3_ID,
        entityType: MediaEntityType.TOUR_SHOW,
        entityId: TOUR_3_ID,
        url: 'https://picsum.photos/seed/tour-madrid-venue/1200/800',
        key: 'media/tours/tour-madrid-venue.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_TOUR4_ID,
        entityType: MediaEntityType.TOUR_SHOW,
        entityId: TOUR_4_ID,
        url: 'https://picsum.photos/seed/tour-bogota-venue/1200/800',
        key: 'media/tours/tour-bogota-venue.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
      {
        id: MEDIA_TOUR5_ID,
        entityType: MediaEntityType.TOUR_SHOW,
        entityId: TOUR_5_ID,
        url: 'https://picsum.photos/seed/tour-sp-venue/1200/800',
        key: 'media/tours/tour-sp-venue.jpg',
        isPrimary: true,
        sortOrder: 0,
      },
    ],
  });
  console.log('✅ Created 5 tour show images');

  console.log('\n🎉 Seeding complete!\n');
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