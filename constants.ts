
import { Project, BlogPost, MoodBoardItem, RestPlate } from './types';

/**
 * Single source of truth for the mobile/desktop split. Mirrors the `md`
 * variant in index.css — change both together or the CSS and JS layouts
 * disagree mid-page.
 *
 * 740 lands in the 736 (iPhone 8 Plus landscape) → 744 (iPad mini portrait)
 * gap, so no device sits on the boundary. Every iPad is desktop in both
 * orientations; phones are mobile in portrait, desktop in landscape from the
 * iPhone X up (812–956), which matches how apple.com treats the same widths.
 */
export const MOBILE_MAX = 740;

export const isMobileViewport = () =>
  typeof window !== 'undefined' && window.innerWidth < MOBILE_MAX;

export const PROJECTS: Project[] = [
  {
    id: '2',
    title: 'Architextures',
    category: 'iOS Development',
    description: 'An iOS app that photographs, classifies, and curates architecture using native platform frameworks.',
    fullDescription: 'Architextures is my in-development iOS app that uses Apple\'s native Vision, SwiftData, AVFoundation, and MapKit frameworks to photograph and curate the world around me.',
    imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/projecthumbnails/architextures.jpg',
    date: 'June 2026',
    role: 'PM/ Developer',
    path: '/works/architextures'
  },
  {
    id: '1',
    title: 'Keep This Vibe, DJ X',
    category: 'Exploration',
    description: 'Idea to Prototype to PRD for a feature that helps DJ X keep the vibe going for long listening sessions.',
    fullDescription: 'The DJX Project focuses on analyzing 8.7 million songs to validate a simple feature for Spotify\'s AI DJ. How I used the full PM cycle to take a personal frustration, stress-test it with data, and prototype a solution.',
    imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/projecthumbnails/djx.jpg',
    date: 'March 2026',
    role: 'Product Manager',
    path: '/works/djx-project'
  },
  {
    id: '3',
    title: 'Un-Selected Works',
    category: 'Archive',
    description: 'A collection of ideas that I couldn\'t vouch for, but are still worth sharing.',
    fullDescription: 'These are ideas that I had for a product or feature, but upon further exploration, I found that I couldn\'t vouch for them for one reason or another.',
    imageUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1200', // Placeholder image, feel free to change
    date: 'Various',
    role: 'Explorer',
    path: '/works#unselected-works',
    isRedirect: true
  },
  {
    id: '4',
    title: 'Spacial Album Art',
    category: 'Product Manager',
    description: 'An attempt to bring a fully immersive artwork experience to Apple Music.',
    fullDescription: 'A rough idea to bring a fully immersive artwork experience to all albums.',
    imageUrl: '',
    date: 'April 2026',
    role: 'Product Manager',
    path: '/works/SpacialMusic'
  },
  {
    id: '5',
    title: 'Apple Music Desktop Redesign',
    category: 'Learning: Design',
    description: 'An attempt to re-make components and un-antiquate the Apple Music Desktop app in 2025.',
    fullDescription: 'A project that attempts to re-make components and un-antiquate the Apple Music Desktop app in 2025.',
    imageUrl: '',
    date: 'March/April 2025',
    role: 'Product Designer',
    path: '/works/AMDesktopRed'
  },
  {
    id: '5',
    title: 'Shared Memories & Captions',
    category: 'Product Manager',
    description: 'A preliminary idea to add collaborative captions and tags to shared albums in the native Photos app.',
    fullDescription: 'This is a preliminary idea, but when we create memories in the native Photos app, we should be able to caption photos, tag contacts who the collection is shared with, etc. This makes it a lot more collaborative and makes it feel more like a scrapbook to be shared and is more personal than just a simple shared album.',
    imageUrl: '',
    date: 'June 2026',
    role: 'Product Manager',
    path: '/works/photo-captions'
  }
];

// Redirect cards (e.g. Un-Selected Works) are navigation, not projects.
export const PROJECT_COUNT = PROJECTS.filter((p) => !p.isRedirect).length;

export const BLOG_POSTS: BlogPost[] = [
  {
    id: '2',
    title: 'On Curation',
    date: 'Random Note, 2025',
    readTime: '1 min read',
    category: 'Random Thoughts',
    excerpt: 'Curation is the root of ones creative prowess.',
    path: '/blog/curation',
    content: `Curation is really the core of all creative prowess...`
  },
  {
    id: '3',
    title: 'The Curse of Nostalgia',
    date: 'Random Note, 2025',
    readTime: '1 min read',
    category: 'Random Thoughts',
    excerpt: 'Nostalgia is probably the most potent and dangerous feeling we have.',
    path: '/blog/nostalgia',
    content: `Nostalgia is probably the most potent and dangerous feeling we have.`
  }
];

// ─────────────────────────────────────────────────────────────
// MOOD BOARD PANES
// To add a new pane: duplicate any entry below and update fields.
// imageUrl → replace with your CDN link
// orientation → 'landscape' or 'portrait' (controls panel sizing)
// link → optional external source link
// ─────────────────────────────────────────────────────────────
export const MOOD_BOARD: MoodBoardItem[] = [

  { id: '1', title: 'Nurture by Porter Robinson', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/Nurture%20Visuals%202.avif', tags: ['Music'], description: 'Perhaps my favorite album of all time. The visuals on this album and the subsequent tour had a major impact in my relationship with nature and how I view the world.', orientation: 'landscape', link: 'https://jackentee.com/project/porter-robinson' },
  { id: '2', title: 'Japanese Gradients', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/%E3%81%86.avif', tags: ['Design'], description: 'Nuevo Tokyo is a studio based in Shibuya that does really good work in R&D and design. I bought this gradient pack a few years ago, this is the う varient I use often.', orientation: 'landscape', link: 'https://www.nuevo.tokyo/japanese-gradients-for-ui' },
  { id: '3', title: 'Air 2 Earth', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/a2e.avif', tags: ['Music'], description: 'Another Porter Robinson work. This is a side project that focuses on Airy House and Tranquil Progressive House.', orientation: 'landscape' },
  { id: '4', title: 'Indian Painters', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/peacock.avif', tags: ['Art'], description: 'Taken from the Chandra Mahal in Jaipur. Amazing Artistry.', orientation: 'portrait' },
  { id: '5', title: 'Ferrari Sp3 Daytona', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/sp3%20daytona.avif', tags: ['Cars'], description: 'One of the most beautiful modern cars.', orientation: 'landscape', link: 'https://en.wikipedia.org/wiki/Ferrari_Daytona_SP3' },
  { id: '6', title: 'Nurture By Porter Robinson (again)', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/Nurture%20Visuals%203.avif', tags: ['Music'], description: 'Another one from Nurture. The interaction between nature, our digital world, and a hopeful message is what makes this album deeply meaningful to me.', orientation: 'landscape', link: 'https://jackentee.com/project/porter-robinson' },
  { id: '7', title: 'Astronaut Bruce McCandless Floating', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/spacewalk.avif', tags: ['Tech'], description: 'This is probably one of the most dangerous things anyone has ever done.', orientation: 'landscape' },
  { id: '8', title: 'Neon Genesis Evangelion', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/neon-genesis-evangelion-unit01-hughes-thompson.avif', tags: ['Art'], description: 'This anime has inspired me to accept myself. Also has amazing visuals.', orientation: 'portrait' },
  { id: '9', title: 'Space Shuttle Program', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/space%20shuttle.avif', tags: ['Tech'], description: 'The best visuals and brand design. Reach for the stars.', orientation: 'landscape' },
  { id: '10', title: 'Discovery by Daft Punk', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/intrastella.avif', tags: ['Music'], description: 'Both Discovery and Intrastella 5555. Amazing.', orientation: 'landscape', link: 'https://www.yokogaomag.com/editorial/interstella5555' },
  { id: '11', title: 'The iPad 2', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/iPad-2-ad.avif', tags: ['Tech'], description: 'This was the first iPad that I ever got. The thin design that formed around your hands along with the magnetic smart folio got my 13 year-old self extremely excited.', orientation: 'landscape', link: 'https://support.apple.com/en-us/111990' },
  { id: '12', title: 'Iridescence', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/iridescent.avif', tags: ['Art'], description: 'Taken at the Hakone Glass Museum - Iridescence is one of the coolest phenomena with light.', orientation: 'portrait' },
  { id: '13', title: 'Old Car Adverts', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/porschelemans.avif', tags: ['Design', 'Art'], description: 'Old car adverts, especially Porsche, had so much panache.', orientation: 'portrait' },
  { id: '14', title: 'Top Gear Africa Special', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/tgafrica.avif', tags: ['Cars', 'TV'], description: 'Top Gear is why I love cars so much. ', orientation: 'landscape', link: 'https://www.youtube.com/watch?v=qqQzU-q8S2o' },
  { id: '15', title: 'Solid Nature', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/solidnature.avif', tags: ['Design', 'Art'], description: 'This is a design firm that specializes in maximizing the potential of marble. At Milan Design Week 2026, they created a supermarket entirely out of marble.', orientation: 'portrait', link: 'https://www.designboom.com/design/il-sonno-supermarket-amo-oma-fruits-vegetables-carved-solidnature-stone-milan-room-dreams/' },
  { id: '16', title: 'Nurture by Porter Robinson | Tour Visuals', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/Nurture%20Visuals.avif', tags: ['Music'], description: 'The Nurture Tour was full of the same themes of appreciating life. Our relationship with nature and having hope for the future.', orientation: 'landscape', link: 'https://jackentee.com/project/porter-robinson' },
  { id: '17', title: 'Works of Hayden Clay', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/trackSocialMedia.avif', tags: ['Art'], description: 'Pictured: Track & Field. Hayden is a 3D artist that portrays the natural world through with a very surreal lens. His words: I’m particular interested in blurring the line between dreams and reality, creating sensations of strange tranquility" I resonate with these themes heavily as that is I also think about art and the world. ', orientation: 'landscape', link: 'https://www.haydenclay.com/other-work' },
  { id: '18', title: 'Works of Tomislav Topić', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/tomislav.avif', tags: ['Art'], description: 'Tomislav Topić is a Berlin based artist who does really great mesh/fabric instalations. I love how his works emphasize how color and light interact in a space.', orientation: 'landscape', link: 'https://tomislav-topic.com/installations' },
  { id: '19', title: 'Works of Takashi Murakami', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/IMG_9410.avif', tags: ['Art'], description: 'Takashi Murakami is a Japanese artist who has inspired many designers and artists I love, like Kanye West. This is a work from when he had an exhibit at the Asian Art Museum.', orientation: 'portrait', link: 'https://gagosian.com/artists/takashi-murakami/' },
  { id: '20', title: 'Mt Madonna', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/MtMadonna.avif', tags: ['Nature'], description: 'Nature has the best gradients. Also has my favorite temple in the world.', orientation: 'landscape' },
  { id: '21', title: 'Sixteen Oceans by Four Tet', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/Sixteen%20Oceans.avif', tags: ['Music'], description: 'This is a deeply personal album for me, as it brings me back to a similar place as Nurture does. But in a much more self-guided, introspective way.', orientation: 'landscape', link: 'https://fourtet.bandcamp.com/album/sixteen-oceans' },
  { id: '22', title: 'Random Access Memories by Daft Punk', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/daft%20punk.avif', tags: ['Music'], description: 'These guys are just the coolest ever. And RAM is a beautiful album built around the appreciation of music.', orientation: 'landscape', link: 'https://daftpunk.com/releases/random-access-memories' },
  { id: '23', title: 'Pokemon Generation 4', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/IMG_0316.avif', tags: ['Game'], description: 'Generation 4 of Pokemon is my favorite generation, I love the world, the lore, everything.', orientation: 'landscape', link: 'https://bulbapedia.bulbagarden.net/wiki/Generation_IV' },
  { id: '24', title: 'Horology', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/1165_metro_neomatik_41_update_1bn_pr.avif', tags: ['Watches'], description: 'I really admire the intricacy and detail that goes into watchmaking. Pictured is a Nomos Metro Neomatik 41 Update.', orientation: 'portrait', link: 'https://nomos-glashuette.com/en-us/tangente/tangente-neomatik-41-update-180?srsltid=AfmBOor2Lck20HVVuOaD7nfWEUsoqS5MjoumGBGn3oNgjH0bPaHGHjLC' },
  { id: '25', title: 'Singapore ArtScience Museum', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/ArtScience.avif', tags: ['Architecture'], description: 'This building is one of my favorites in the world. The lotus is also a special flower in India, symbolizing symbolises creation, purity and enlightenment. Things that Art and Science stand for. The perfect concept for a building', orientation: 'landscape' },
  { id: '26', title: 'iPhone Air', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/iphoneair.avif', tags: ['Tech'], description: 'Greatest phone since the iPhone X', orientation: 'landscape', link: 'https://www.apple.com/iphone-air/' },
  { id: '27', title: 'Rajasthani Phad Paintings', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/IMG_8577.avif', tags: ['Art'], description: 'This is a painting my family bought form Rajhasthan. I love the use of color and contrast in this classical Indian painting style.', orientation: 'landscape' },
  { id: '28', title: 'Works of Hiroshi Yoshida', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/the-palace-of-udaipur.avif', tags: ['Art'], description: 'I discovered Hiroshi Yoshida and his work in late High School. He has a way of making the world feel more serene that I adore.', orientation: 'portrait', link: 'https://hiroshiyoshida.art/product-category/india-and-southeast-asia/' },
  { id: '29', title: 'Time n Place by Kero Kero Bonito', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/kkbtnp.avif', tags: ['Music'], description: ' I resonate heavily with this album because it talks all about how it sucks growing up. Makes me appreciate life as I grow older.', orientation: 'landscape', link: 'https://kerokerobonito.bandcamp.com/album/time-n-place' },
  { id: '30', title: 'Osaka World Expo - Joinery', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/mood%20board/worldexpo.avif', tags: ['Architecture', 'Design'], description: 'The Osaka World Exo ring was one of the things I really wanted to see when I went. It uses a concept called Nuki which is a joinery style that tries to do everything without glue or nails. Sashimoni is also another joinery style I love.', orientation: 'portrait', link: 'https://www.dezeen.com/2025/04/24/the-grand-ring-expo-2025-osaka/' }
];

// ─────────────────────────────────────────────────────────────
// (REST) — the mood board's quiet room. Desktop only.
//
// A full-bleed background, a drifting WebGL cloud layer over it, and
// photographs that breathe in and out at random spots on the screen.
// Everything you'd want to tune lives in this block.
// ─────────────────────────────────────────────────────────────

/**
 * Master switch for the (Rest) tab.
 *
 * Off: the toggle never renders, so the view is unreachable and none of its
 * work ever starts — no backdrop fetch, no WebGL context, no plate scheduler.
 * Everything below stays wired up; flip this to `true` to bring it back.
 */
export const REST_TAB_ENABLED = false;

/** Full-screen backdrop for the (Rest) tab. Rendered `object-cover`. */
export const REST_BACKGROUND_URL =
  'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/%E3%81%86.avif';

/**
 * Cloud-layer settings, passed straight through to <Clouds>. These are the
 * values from the canvasui.dev playground; see components/UI/Clouds.tsx for
 * the full option list (density, shading, opacity, wind, refraction…).
 */
export const REST_CLOUD_OPTIONS = {
  scale: 1.05,
  speed: 1.2,
  cover: 0.18,
  shadowOffsetY: 200,
};

/**
 * The photographs. Clouds, mountains — whatever you want to sit with.
 *
 * Order doesn't matter: the section shuffles them into a deck and deals the
 * whole deck before reshuffling, so nothing repeats until everything has been
 * shown. Size and placement are computed from each image's real aspect ratio,
 * so portrait and landscape both work — no `orientation` field needed.
 *
 * Four or more entries gives the rotation enough room to feel unrepetitive.
 * With zero entries the tab still renders: background and clouds, nothing else.
 */
export const REST_PLATES: RestPlate[] = [
  // Paste your CDN links here. Example:
  //
  // { id: 'r1', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/rest/sky-01.avif' },
  // { id: 'r2', imageUrl: 'https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/rest/ridge-02.avif', caption: 'Mt Madonna, June' },
];

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/aditya.pictures/',
  twitter: 'https://x.com/adityav__',
  linkedin: 'https://www.linkedin.com/in/adityavishwakarma1/',
  email: 'mailto:aditya1vishwakarma@gmail.com'
};
