import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { MeiliSearch } from 'meilisearch';

const prisma = new PrismaClient();

const MEILI_HOST = process.env.MEILISEARCH_HOST!;
const MEILI_KEY = process.env.MEILISEARCH_API_KEY!;
const client = new MeiliSearch({ host: MEILI_HOST, apiKey: MEILI_KEY });

const IDX_HOTELS = 'hotels';
const IDX_LOCATIONS = 'locations';
const IDX_ROOM_TYPES = 'room_types';

async function initIndexes() {
  await client.index(IDX_HOTELS).updateSettings({
    searchableAttributes: [
      'name',
      'address',
      'location.city',
      'location.country',
      'amenities',
    ],
    filterableAttributes: [
      'stars',
      'amenities',
      'priceFrom',
      'priceTo',
      'location.city',
      'location.country',
    ],
    sortableAttributes: ['priceFrom', 'priceTo', 'stars'],
    displayedAttributes: ['*'],
    rankingRules: [
      'words',
      'typo',
      'proximity',
      'attribute',
      'sort',
      'exactness',
    ],
  });

  await client.index(IDX_LOCATIONS).updateSettings({
    searchableAttributes: ['city', 'country', 'slug'],
    filterableAttributes: ['country'],
    displayedAttributes: ['*'],
  });

  await client.index(IDX_ROOM_TYPES).updateSettings({
    searchableAttributes: ['name', 'amenities'],
    filterableAttributes: ['hotelId', 'priceFrom', 'priceTo'],
    sortableAttributes: ['priceFrom', 'priceTo'],
    displayedAttributes: ['*'],
  });
}

function chunk<T>(arr: T[], size = 1000) {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function seedLocations() {
  const locations = await prisma.location.findMany({
    select: { id: true, city: true, country: true, slug: true },
  });
  const batches = chunk(locations, 1000);
  for (const b of batches)
    await client.index(IDX_LOCATIONS).addDocuments(b, { primaryKey: 'id' });
  console.log(`Seeded ${locations.length} locations`);
}

async function seedHotels() {
  const hotels = await prisma.hotel.findMany({
    select: {
      id: true,
      name: true,
      address: true,
      stars: true,
      latitude: true,
      longitude: true,
      amenities: true,
      priceFrom: true,
      priceTo: true,
      location: { select: { city: true, country: true } },
    },
  });

  const docs = hotels.map((h) => ({
    id: h.id,
    name: h.name,
    address: h.address,
    stars: h.stars,
    amenities: h.amenities,
    priceFrom: h.priceFrom ?? null,
    priceTo: h.priceTo ?? null,
    location: h.location,
    geo: { lat: h.latitude, lng: h.longitude },
  }));

  const batches = chunk(docs, 1000);
  for (const b of batches)
    await client.index(IDX_HOTELS).addDocuments(b, { primaryKey: 'id' });
  console.log(`Seeded ${docs.length} hotels`);
}

async function seedRoomTypes() {
  const rts = await prisma.roomType.findMany({
    select: {
      id: true,
      hotelId: true,
      name: true,
      amenities: true,
      priceFrom: true,
      priceTo: true,
    },
  });
  const batches = chunk(rts, 1000);
  for (const b of batches)
    await client.index(IDX_ROOM_TYPES).addDocuments(b, { primaryKey: 'id' });
  console.log(`Seeded ${rts.length} room types`);
}

async function main() {
  await initIndexes(); // thiết lập searchable/filterable/sortable trước
  await seedLocations();
  await seedHotels();
  await seedRoomTypes();
}

main()
  .then(() => console.log('Meili seed done'))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => await prisma.$disconnect());
