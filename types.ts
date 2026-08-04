
export interface Project {
  id: string;
  title: string;
  category: string;
  description: string;
  fullDescription: string;
  imageUrl: string;
  date: string;
  role: string;
  path: string; // Added to match Blog structure
  isRedirect?: boolean; // Card that links elsewhere on the site, not a project itself
}

export interface BlogPost {
  id: string;
  title: string;
  date: string;
  readTime: string;
  excerpt: string;
  category: string;
  path: string;
  content: string;
}

export interface NavItem {
  label: string;
  href: string;
}

export interface MoodBoardItem {
  id: string;
  title: string;
  imageUrl: string;
  tags: string[];
  description: string;
  link?: string;
  orientation?: 'landscape' | 'portrait';
  cols?: number;
}

/**
 * A single photograph shown in the mood board's "(Rest)" tab. Deliberately
 * thinner than MoodBoardItem — these are just pictures, with no tags, links or
 * descriptions to read. The layout derives everything else (size, position,
 * timing) at runtime from the image's own aspect ratio.
 */
export interface RestPlate {
  id: string;
  imageUrl: string;
  /** Optional one-liner shown beneath the photo (place, date, whatever). */
  caption?: string;
}
