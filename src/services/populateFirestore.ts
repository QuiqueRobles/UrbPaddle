import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyAut2zIjTH1ruTpKoX4f2bKLWr11geRB8I",
  authDomain: "partymilano-378f6.firebaseapp.com",
  projectId: "partymilano-378f6",
  storageBucket: "partymilano-378f6.appspot.com",
  messagingSenderId: "571200478793",
  appId: "1:571200478793:web:5c8b933d442a1a8592a998"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const clubsData = [
  {
    name: "Armani Privé",
    rating: 4.7,
    attendees: 250,
    image: "https://www.armani.com/content/dam/armani/Restaurants/prive/prive-milano/gallery/armani-prive-milano-gallery-01.jpg",
    price: 30,
    category: "Luxury",
    description: "Experience the epitome of Milan nightlife at Armani Privé. Sleek design, world-class DJs, and an atmosphere of pure luxury await you.",
    address: "Via Manzoni 31, 20121 Milano",
    openingHours: "23:30 - 04:00",
    dressCode: "Elegant",
    musicGenre: "House, Electronic"
  },
  {
    name: "Just Cavalli",
    rating: 4.5,
    attendees: 200,
    image: "https://media-cdn.tripadvisor.com/media/photo-s/13/c4/b8/8a/just-cavalli-milano.jpg",
    price: 25,
    category: "Fashion",
    description: "Immerse yourself in the glamorous world of Roberto Cavalli at this trendy nightclub. Enjoy signature cocktails and dance the night away.",
    address: "Via Luigi Camoens, 20121 Milano",
    openingHours: "23:30 - 05:00",
    dressCode: "Smart Casual",
    musicGenre: "Pop, R&B"
  },
  {
    name: "Hollywood",
    rating: 4.3,
    attendees: 300,
    image: "https://www.hollywoodmilano.it/wp-content/uploads/2019/10/hollywood-discoteca-milano.jpg",
    price: 20,
    category: "Nightclub",
    description: "One of Milan's most famous nightclubs, Hollywood offers a vibrant atmosphere with multiple rooms playing different music genres.",
    address: "Corso Como 15, 20154 Milano",
    openingHours: "23:30 - 05:00",
    dressCode: "Stylish",
    musicGenre: "Mixed, Top 40"
  },
  {
    name: "Loolapaloosa",
    rating: 4.2,
    attendees: 220,
    image: "https://www.loolapaloosa.com/wp-content/uploads/2019/09/loolapaloosa-milano-corso-como.jpg",
    price: 15,
    category: "Dance",
    description: "A favorite among locals and tourists alike, Loolapaloosa offers a vibrant atmosphere with great music and affordable drinks.",
    address: "Corso Como 17, 20154 Milano",
    openingHours: "23:00 - 04:30",
    dressCode: "Casual Chic",
    musicGenre: "Dance, Electronic"
  },
  {
    name: "Volt Club",
    rating: 4.6,
    attendees: 180,
    image: "https://www.voltmilano.com/wp-content/uploads/2019/10/volt-club-milano.jpg",
    price: 22,
    category: "Electronic",
    description: "Volt Club is the go-to destination for electronic music lovers. State-of-the-art sound system and regular appearances by international DJs.",
    address: "Via Felice Casati 14, 20124 Milano",
    openingHours: "23:30 - 05:00",
    dressCode: "Creative",
    musicGenre: "Techno, House"
  },
  {
    name: "Old Fashion Club",
    rating: 4.4,
    attendees: 280,
    image: "https://www.oldfashion.it/wp-content/uploads/2019/09/old-fashion-club-milano.jpg",
    price: 18,
    category: "Classic",
    description: "A historic venue in Milan, Old Fashion Club offers a mix of classic and modern music in a sophisticated setting.",
    address: "Viale Emilio Alemagna 6, 20121 Milano",
    openingHours: "23:00 - 04:30",
    dressCode: "Smart",
    musicGenre: "Mixed, 80s, 90s, Current Hits"
  },
  {
    name: "The Club",
    rating: 4.5,
    attendees: 200,
    image: "https://www.theclubmilano.it/wp-content/uploads/2019/10/the-club-milano.jpg",
    price: 25,
    category: "Exclusive",
    description: "An exclusive nightclub known for its selective door policy and high-profile clientele. Expect top-notch service and a luxurious atmosphere.",
    address: "Corso Garibaldi 97, 20121 Milano",
    openingHours: "23:30 - 05:00",
    dressCode: "Elegant",
    musicGenre: "House, Hip-Hop"
  },
  {
    name: "Plastic",
    rating: 4.3,
    attendees: 250,
    image: "https://www.plasticmilano.it/wp-content/uploads/2019/09/plastic-club-milano.jpg",
    price: 15,
    category: "Alternative",
    description: "A legendary club in Milan's nightlife scene, Plastic is known for its eclectic crowd and alternative music selection.",
    address: "Via Gargano 15, 20139 Milano",
    openingHours: "00:00 - 05:00",
    dressCode: "Anything Goes",
    musicGenre: "Alternative, Electronic, Indie"
  },
  {
    name: "Magazzini Generali",
    rating: 4.2,
    attendees: 400,
    image: "https://www.magazzinigenerali.it/wp-content/uploads/2019/10/magazzini-generali-milano.jpg",
    price: 15,
    category: "Warehouse",
    description: "Housed in a former warehouse, this club offers a raw, industrial vibe and hosts a variety of music events and live performances.",
    address: "Via Pietrasanta 16, 20141 Milano",
    openingHours: "23:00 - 04:30",
    dressCode: "Casual",
    musicGenre: "Varied (depends on event)"
  },
  {
    name: "Tunnel Club",
    rating: 4.4,
    attendees: 300,
    image: "https://www.tunnelclub.it/wp-content/uploads/2019/09/tunnel-club-milano.jpg",
    price: 20,
    category: "Underground",
    description: "True to its name, Tunnel Club offers an underground experience with a focus on techno and house music.",
    address: "Via Giovanni Battista Sammartini 30, 20125 Milano",
    openingHours: "23:30 - 05:00",
    dressCode: "Casual",
    musicGenre: "Techno, House"
  },
  {
    name: "Alcatraz",
    rating: 4.5,
    attendees: 500,
    image: "https://www.alcatrazmilano.it/wp-content/uploads/2019/09/alcatraz-club-milano.jpg",
    price: 20,
    category: "Multi-purpose",
    description: "Alcatraz is one of Milan's largest and most versatile venues, featuring multiple rooms for different music styles and regular live concerts.",
    address: "Via Valtellina 25, 20159 Milano",
    openingHours: "23:00 - 05:00",
    dressCode: "Casual",
    musicGenre: "Rock, Electronic, Pop, Live Music"
  }
];

async function populateClubs() {
  for (const club of clubsData) {
    try {
      const docRef = await addDoc(collection(db, "clubs"), club);
      console.log("Document written with ID: ", docRef.id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  }
}

populateClubs().then(() => console.log("Population complete")).catch(console.error);