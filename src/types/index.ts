export interface User {
  id: string;
  name: string;
  username: string;
  email: string;
  avatar: string;
  college: string;
  branch: string;
  year: number;
  bio?: string;
  followers: number;
  following: number;
  isFollowing?: boolean;
}

export interface Post {
  id: string;
  userId: string;
  user: User;
  image: string;
  caption: string;
  description?: string;
  hashtags: string[];
  likes: number;
  comments: number;
  shares: number;
  isLiked: boolean;
  createdAt: Date;
  visibility: 'my_college' | 'all_colleges' | 'followers';
}

export interface Note {
  id: string;
  userId: string;
  user: User;
  title: string;
  subject: string;
  year: string;
  description: string;
  resourceType: 'pdf' | 'link' | 'doc';
  resourceUrl?: string;
  likes: number;
  saves: number;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: Date;
}

export interface Notification {
  id: string;
  type: 'like' | 'comment' | 'follow' | 'event';
  user?: User;
  message: string;
  time: string;
  isRead: boolean;
}

export interface Comment {
  id: string;
  userId: string;
  user: User;
  text: string;
  likes: number;
  createdAt: Date;
}

export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};

export type AuthStackParamList = {
  Starting: undefined;
  Welcome: undefined;
  Signup: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
  PostDetail: { postId: string };
  Notifications: undefined;
  Events: undefined;
  EventDetail: { eventId: string };
  Messages: undefined;
  ChatDetail: { userId: string; userName: string; userAvatar: string };
};

export type DiscoverStackParamList = {
  Discover: undefined;
  PostDetail: { postId: string };
};

export type NotesStackParamList = {
  Notes: undefined;
  NoteDetail: { noteId: string };
};

export type ProfileStackParamList = {
  Profile: undefined;
  EditProfile: undefined;
  Settings: undefined;
  FollowersScreen: { userId: string }; // New
  FollowingScreen: { userId: string }; // New
  PostDetailScreen: { postId: string };
  NoteDetailSCreen: { noteId: string };
  EventDetailScreen: {eventId: string};
};

export type TabParamList = {
  HomeStack: undefined;
  DiscoverStack: undefined;
  Create: undefined;
  NotesStack: undefined;
  ProfileStack: undefined;
};