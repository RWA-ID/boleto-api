import 'dotenv/config'
import { db, schema } from '../api/src/db'
import { normalizeSlug } from '../api/src/services/slugNormalize'

export const RESERVED_ARTISTS = [
  { slug: 'bad-bunny',          normalizedSlug: 'badbunny' },
  { slug: 'maluma',             normalizedSlug: 'maluma' },
  { slug: 'ozuna',              normalizedSlug: 'ozuna' },
  { slug: 'nicky-jam',          normalizedSlug: 'nickyjam' },
  { slug: 'j-balvin',           normalizedSlug: 'jbalvin' },
  { slug: 'becky-g',            normalizedSlug: 'beckyg' },
  { slug: 'karol-g',            normalizedSlug: 'karolg' },
  { slug: 'anuel-aa',           normalizedSlug: 'anuelaa' },
  { slug: 'daddy-yankee',       normalizedSlug: 'daddyyankee' },
  { slug: 'pitbull',            normalizedSlug: 'pitbull' },
  { slug: 'marc-anthony',       normalizedSlug: 'marcanthony' },
  { slug: 'romeo-santos',       normalizedSlug: 'romeosantos' },
  { slug: 'shakira',            normalizedSlug: 'shakira' },
  { slug: 'wisin',              normalizedSlug: 'wisin' },
  { slug: 'yandel',             normalizedSlug: 'yandel' },
  { slug: 'farruko',            normalizedSlug: 'farruko' },
  { slug: 'myke-towers',        normalizedSlug: 'myketowers' },
  { slug: 'rauw-alejandro',     normalizedSlug: 'rawalejandro' },
  { slug: 'jhay-cortez',        normalizedSlug: 'jhaycortez' },
  { slug: 'sech',               normalizedSlug: 'sech' },
  { slug: 'natti-natasha',      normalizedSlug: 'nattinatasha' },
  { slug: 'lunay',              normalizedSlug: 'lunay' },
  { slug: 'bad-gyal',           normalizedSlug: 'badgyal' },
  { slug: 'el-alfa',            normalizedSlug: 'elalfa' },
  { slug: 'feid',               normalizedSlug: 'feid' },
  { slug: 'grupo-frontera',     normalizedSlug: 'grupofrontera' },
  { slug: 'ivan-cornejo',       normalizedSlug: 'ivancornejo' },
  { slug: 'junior-h',           normalizedSlug: 'juniorh' },
  { slug: 'marc-segui',         normalizedSlug: 'marcsegui' },
  { slug: 'peso-pluma',         normalizedSlug: 'pesopluma' },
  { slug: 'ryan-castro',        normalizedSlug: 'ryancastro' },
  { slug: 'tainy',              normalizedSlug: 'tainy' },
  { slug: 'wisin-yandel',       normalizedSlug: 'wisinyandel' },
  { slug: 'don-omar',           normalizedSlug: 'donomar' },
  { slug: 'arcangel',           normalizedSlug: 'arcangel' },
  { slug: 'de-la-ghetto',       normalizedSlug: 'delaghetto' },
  { slug: 'yomo',               normalizedSlug: 'yomo' },
  { slug: 'cosculluela',        normalizedSlug: 'cosculluela' },
  { slug: 'mora',               normalizedSlug: 'mora' },
  { slug: 'blessd',             normalizedSlug: 'blessd' },
  { slug: 'danny-ocean',        normalizedSlug: 'dannyocean' },
  { slug: 'luis-fonsi',         normalizedSlug: 'luisfonsi' },
  { slug: 'ricky-martin',       normalizedSlug: 'rickymartin' },
  { slug: 'enrique-iglesias',   normalizedSlug: 'enriqueiglesias' },
  { slug: 'juan-gabriel',       normalizedSlug: 'juangabriel' },
  { slug: 'vicente-fernandez',  normalizedSlug: 'vicentefernandez' },
  { slug: 'christian-nodal',    normalizedSlug: 'christiannodal' },
  { slug: 'banda-ms',           normalizedSlug: 'bandams' },
  { slug: 'los-bukis',          normalizedSlug: 'losbukis' },
  { slug: 'intocable',          normalizedSlug: 'intocable' },
]

async function runSeed() {
  console.log(`Seeding ${RESERVED_ARTISTS.length} reserved artists...`)

  await db
    .insert(schema.reservedArtists)
    .values(RESERVED_ARTISTS)
    .onConflictDoNothing()

  console.log('Done.')
  process.exit(0)
}

// Run if called directly
if (require.main === module) {
  runSeed().catch((err) => {
    console.error(err)
    process.exit(1)
  })
}

export { runSeed }
