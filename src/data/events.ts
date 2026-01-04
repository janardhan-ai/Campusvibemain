export interface Event {
  id: string;
  title: string;
  description: string;
  event_date: string;
  location: string;
  college_name: string;
  image_url: string;
  max_attendees: number;
  current_attendees: number;
  category: string;
  created_at: string;
}

export interface EventBooking {
  id: string;
  event_id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  booking_status: string;
  booked_at: string;
}

export const mockEvents: Event[] = [
  {
    id: '1',
    title: 'Tech Fest 2024',
    description: 'Join us for the biggest tech festival of the year! Experience cutting-edge technology, attend workshops, participate in coding competitions, and network with industry professionals. This three-day event features keynote speakers from top tech companies, hands-on demos, and exciting prizes.',
    event_date: '2024-12-20T10:00:00Z',
    location: 'Main Auditorium, Building A',
    college_name: 'MIT College of Engineering',
    image_url: 'https://images.pexels.com/photos/2774556/pexels-photo-2774556.jpeg',
    max_attendees: 500,
    current_attendees: 324,
    category: 'Technical',
    created_at: '2024-12-01T10:00:00Z',
  },
  {
    id: '2',
    title: 'Annual Cultural Night',
    description: 'Experience an evening filled with music, dance, drama, and cultural performances from students across all departments. Witness the rich diversity of our campus culture through various art forms and performances.',
    event_date: '2024-12-15T18:00:00Z',
    location: 'Open Air Theater',
    college_name: 'St. Xavier\'s College',
    image_url: 'https://images.pexels.com/photos/1190298/pexels-photo-1190298.jpeg',
    max_attendees: 1000,
    current_attendees: 756,
    category: 'Cultural',
    created_at: '2024-11-25T10:00:00Z',
  },
  {
    id: '3',
    title: 'Inter-College Cricket Tournament',
    description: 'The most anticipated sports event of the season! Teams from 12 colleges will compete for the championship trophy. Come support your college team and enjoy three days of thrilling cricket action.',
    event_date: '2024-12-18T08:00:00Z',
    location: 'University Sports Complex',
    college_name: 'Delhi University',
    image_url: 'https://images.pexels.com/photos/1618269/pexels-photo-1618269.jpeg',
    max_attendees: 200,
    current_attendees: 189,
    category: 'Sports',
    created_at: '2024-11-20T10:00:00Z',
  },
  {
    id: '4',
    title: 'AI & Machine Learning Workshop',
    description: 'A comprehensive 2-day workshop covering the fundamentals of AI and ML. Learn from industry experts, work on real-world projects, and get certified. Topics include neural networks, deep learning, and practical ML applications.',
    event_date: '2024-12-22T09:00:00Z',
    location: 'Computer Science Lab, 3rd Floor',
    college_name: 'IIT Bombay',
    image_url: 'https://images.pexels.com/photos/8439093/pexels-photo-8439093.jpeg',
    max_attendees: 50,
    current_attendees: 45,
    category: 'Workshop',
    created_at: '2024-11-28T10:00:00Z',
  },
  {
    id: '5',
    title: 'Career Guidance Seminar',
    description: 'Get insights from successful alumni and industry leaders about career opportunities, skill development, and professional growth. Perfect for final year students planning their career paths.',
    event_date: '2024-12-16T14:00:00Z',
    location: 'Conference Hall B',
    college_name: 'Christ University',
    image_url: 'https://images.pexels.com/photos/3184292/pexels-photo-3184292.jpeg',
    max_attendees: 300,
    current_attendees: 142,
    category: 'Seminar',
    created_at: '2024-11-30T10:00:00Z',
  },
  {
    id: '6',
    title: 'Startup Pitch Competition',
    description: 'Present your innovative startup ideas to a panel of investors and entrepreneurs. Win funding, mentorship, and resources to turn your ideas into reality. Open to all students with entrepreneurial dreams.',
    event_date: '2024-12-25T10:00:00Z',
    location: 'Innovation Hub',
    college_name: 'BITS Pilani',
    image_url: 'https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg',
    max_attendees: 100,
    current_attendees: 67,
    category: 'General',
    created_at: '2024-12-02T10:00:00Z',
  },
  // --- ADDED NEW EVENTS BELOW ---
  {
    id: '7',
    title: 'Digital Art & Photography Expo',
    description: 'Showcase your creativity! A gallery exhibition featuring the best digital art and photography from campus talent. Includes guest lectures from renowned photographers.',
    event_date: '2024-12-28T11:00:00Z',
    location: 'Art Gallery, Main Block',
    college_name: 'NIFT Hyderabad',
    image_url: 'https://images.pexels.com/photos/1264210/pexels-photo-1264210.jpeg',
    max_attendees: 400,
    current_attendees: 120,
    category: 'Arts',
    created_at: '2024-12-05T09:00:00Z',
  },
  {
    id: '8',
    title: 'Campus Music Festival',
    description: 'A night of electrifying music featuring student bands and a special guest DJ performance. Food stalls, games, and non-stop entertainment await!',
    event_date: '2024-12-30T19:00:00Z',
    location: 'College Ground',
    college_name: 'SRM University',
    image_url: 'https://images.pexels.com/photos/1763075/pexels-photo-1763075.jpeg',
    max_attendees: 2000,
    current_attendees: 1500,
    category: 'Cultural',
    created_at: '2024-12-10T14:00:00Z',
  },
  {
    id: '9',
    title: 'Blockchain & Web3 Summit',
    description: 'Dive deep into the world of Web3, NFTs, and Blockchain technology. Workshops on Smart Contracts and discussions on the future of decentralized finance.',
    event_date: '2025-01-05T09:30:00Z',
    location: 'Virtual Lab 2',
    college_name: 'IIIT Hyderabad',
    image_url: 'https://images.pexels.com/photos/844124/pexels-photo-844124.jpeg',
    max_attendees: 150,
    current_attendees: 80,
    category: 'Technical',
    created_at: '2024-12-12T11:00:00Z',
  },
  {
    id: '10',
    title: 'Mental Health & Yoga Retreat',
    description: 'Take a break from the academic stress. Join us for a morning of Yoga, Meditation, and discussions on mental well-being with certified practitioners.',
    event_date: '2025-01-10T06:30:00Z',
    location: 'Campus Park',
    college_name: 'Osmania University',
    image_url: 'https://images.pexels.com/photos/3823039/pexels-photo-3823039.jpeg',
    max_attendees: 60,
    current_attendees: 25,
    category: 'Health',
    created_at: '2024-12-15T08:00:00Z',
  },
];

export const mockBookings: EventBooking[] = [];