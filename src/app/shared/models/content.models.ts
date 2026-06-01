export interface EventItem {
  id: number;
  slug?: string;
  title: string;
  tagline?: string;
  category: 'Workshop' | 'Research' | 'Competition' | 'Networking';
  status?: EventStatus;
  eventType?: EventType;
  date: string;
  time: string;
  venue: string;
  description: string;
  image: string;
  registrationLink?: string;
  organizingTeam?: string;
  speakers?: string[];
  highlights?: string[];
  page?: EventPageContent;
}

export type EventStatus = 'Upcoming' | 'Current' | 'Past';

export type EventType =
  | 'Conference'
  | 'Workshop'
  | 'Seminar'
  | 'Guest Lecture'
  | 'Research Showcase'
  | 'Hackathon'
  | 'Networking Event'
  | 'Webinar'
  | 'Competition'
  | 'Custom Event';

export interface ProjectItem {
  id: number;
  title: string;
  domain: string;
  category: 'Healthcare AI' | 'Drug Discovery' | 'RAG Systems' | 'NLP' | 'Computer Vision' | 'AI Agents' | 'Robotics';
  techStack: string[];
  description: string;
  details: string;
  contributors: string[];
  github: string;
  demo: string;
  image?: string;
}

export interface TeamMember {
  name: string;
  role: string;
  group: string;
  bio: string;
  image: string;
  linkedin: string;
  github: string;
  type?: 'faculty' | 'officer';
  department?: string;
  website?: string;
  isCurrent?: boolean;
  yearsServed?: string;
}

export interface GalleryItem {
  title: string;
  category: string;
  image: string;
}

export interface GalleryPhoto {
  title: string;
  image: string;
}

export interface GalleryCollection {
  id: number;
  title: string;
  eventDate: string;
  coverImage: string;
  description: string;
  photos: GalleryPhoto[];
}

export type MediaCategory = 'leadership' | 'events' | 'gallery' | 'projects' | 'speakers';

export interface MediaAsset {
  id: string;
  name: string;
  category: MediaCategory;
  url: string;
  path?: string;
  galleryId?: number;
  size: number;
  type: string;
  uploadedAt: string;
}

export interface EditableTextBlock {
  eyebrow: string;
  title: string;
  copy: string;
}

export interface AboutInfoBlock {
  title: string;
  copy: string;
}

export interface TimelineItem {
  year: string;
  title: string;
  copy: string;
}

export interface SiteContent {
  aboutHero: EditableTextBlock;
  aboutCards: AboutInfoBlock[];
  aboutFocus: {
    eyebrow: string;
    title: string;
    areas: string[];
  };
  aboutTimeline: {
    eyebrow: string;
    title: string;
    items: TimelineItem[];
  };
  eventsHero: EditableTextBlock;
  pastEventsHero: EditableTextBlock;
  projectsHero: EditableTextBlock;
  leadershipHero: EditableTextBlock;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
}

export interface StatItem {
  label: string;
  value: number | string;
  suffix: string;
}

export interface Highlight {
  icon: string;
  title: string;
  description: string;
}

export interface Speaker {
  name: string;
  designation: string;
  organization: string;
  initials: string;
  linkedin: string;
}

export interface PastEvent {
  id: number;
  slug: string;
  title: string;
  tagline: string;
  overview: string;
  date: string;
  time: string;
  venue: string;
  organizedBy: string;
  campus: string;
  banner: string;
  videoUrl?: string;
  bannerVideoUrl?: string;
  stats: StatItem[];
  highlights: Highlight[];
  speakers: Speaker[];
  schedule: Array<{ time: string; title: string }>;
  gallery: GalleryItem[];
}

export interface EventSpeaker {
  name: string;
  designation: string;
  organization: string;
  bio: string;
  image: string;
  linkedin: string;
}

export interface EventSponsor {
  name: string;
  logo: string;
  website: string;
}

export interface EventVideo {
  title: string;
  url: string;
}

export interface CustomEventSection {
  title: string;
  layout: 'Text' | 'Cards';
  content: string;
  image?: string;
  enabled?: boolean;
  order?: number;
}

export interface EventPageContent {
  about: string;
  sectionOrder?: string[];
  enabledSections?: Partial<Record<EventTemplateSection, boolean>>;
  highlights: Highlight[];
  speakers: EventSpeaker[];
  instructors?: EventSpeaker[];
  judges?: EventSpeaker[];
  presenters?: EventSpeaker[];
  learningOutcomes?: string[];
  resources?: Array<{ title: string; url: string }>;
  agenda?: Array<{ time: string; title: string }>;
  rules?: string[];
  tracks?: string[];
  prizes?: string[];
  posters?: Array<{ title: string; presenter: string; mentor?: string; abstract?: string }>;
  awards?: Array<{ title: string; recipient: string; description?: string }>;
  gallery: GalleryItem[];
  sponsors: EventSponsor[];
  videos: EventVideo[];
  customSections: CustomEventSection[];
}

export type EventTemplateSection =
  | 'about'
  | 'speakers'
  | 'instructors'
  | 'learningOutcomes'
  | 'resources'
  | 'gallery'
  | 'sponsors'
  | 'videos'
  | 'highlights'
  | 'networking'
  | 'agenda'
  | 'registration'
  | 'rules'
  | 'tracks'
  | 'judges'
  | 'prizes'
  | 'posters'
  | 'presenters'
  | 'mentors'
  | 'awards'
  | 'customSections';
