export type Category = "美食" | "手工" | "数码" | "生活" | "园艺";

export interface Annotation {
  x: number; // percent 0-100
  y: number; // percent 0-100
  label: string;
}

export interface Step {
  id: string;
  title: string;
  imagePrompt: string;
  text: string;
  annotations?: Annotation[];
  video?: string;
}

export interface Reply {
  id: string;
  author: string;
  isAuthor: boolean; // tutorial uploader
  text: string;
  date: string;
}

export interface Comment {
  id: string;
  author: string;
  avatarColor: string;
  text: string;
  date: string;
  replies: Reply[];
  stepIndex?: number; // which step the question is about
}

export interface Tutorial {
  id: string;
  title: string;
  category: Category;
  coverPrompt: string;
  coverSize: ImageSize;
  tags: string[];
  author: string;
  authorRole: string;
  avatarColor: string;
  date: string;
  intro: string;
  steps: Step[];
  comments: Comment[];
  saved?: boolean;
  likes?: number;
}

export type ImageSize =
  | "square_hd"
  | "square"
  | "portrait_4_3"
  | "portrait_16_9"
  | "landscape_4_3"
  | "landscape_16_9";

export interface FamilyMember {
  id: string;
  name: string;
  role: string;
  avatarColor: string;
  learned: string[]; // tutorial ids
  saved: string[];
  pendingQuestions: number;
}
