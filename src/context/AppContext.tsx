import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Post, Note, Notification } from '../types';
import { users as initialUsers } from '../data/users';
import { posts as initialPosts } from '../data/posts';
import { notes as initialNotes } from '../data/notes';
import { notifications as initialNotifications } from '../data/notifications';
import { mockEvents, Event } from '../data/events';
import { supabase } from '../lib/supabase';

// Define the Status Type
type FollowStatus = 'None' | 'Following' | 'Requested';

interface AppContextType {
  currentUser: User | null;
  setCurrentUser: (user: User | null) => void;
  posts: Post[];
  notes: Note[];
  notifications: Notification[];
  events: Event[];
  likePost: (postId: string) => void;
  likeNote: (noteId: string) => void;
  saveNote: (noteId: string) => void;
  
  // UPDATED: New robust Follow functions
  followUser: (targetUser: User) => Promise<void>;
  unfollowUser: (userId: string) => Promise<void>;
  checkFollowStatus: (userId: string) => Promise<FollowStatus>;

  addPost: (post: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'shares' | 'isLiked'>) => void;
  addNote: (note: Omit<Note, 'id' | 'createdAt' | 'likes' | 'saves' | 'isLiked' | 'isSaved'>) => void;
  markNotificationAsRead: (notificationId: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [events] = useState<Event[]>(mockEvents);

  useEffect(() => {
    const fetchUserProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (profile) {
        // Ensure your Supabase 'profiles' table has an 'is_private' column!
        const user: User = {
          id: profile.id,
          username: profile.username,
          name: profile.name,
          email: profile.email,
          avatar: profile.avatar || '',
          college: profile.college || '',
          branch: profile.branch || '',
          year: profile.year || 1,
          bio: profile.bio || '',
          followers: profile.followers || 0,
          following: profile.following || 0,
          // @ts-ignore - Assuming you added is_private to DB
          isPrivate: profile.is_private || false 
        };
        setCurrentUser(user);
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (event === 'SIGNED_IN' && session?.user) {
            await fetchUserProfile(session.user.id);
          } else if (event === 'SIGNED_OUT') {
            setCurrentUser(null);
          }
        })();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  // --- LOGIC 4: THE TRUST LOGIC IMPLEMENTATION ---
  const followUser = async (targetUser: User) => {
    if (!currentUser) return;

    // 1. CHECK: Does the target user ALREADY follow me?
    // We query the database to see if a row exists where follower = target AND target = me
    const { data: reverseFollow } = await supabase
        .from('follows')
        .select('status')
        .eq('follower_id', targetUser.id)
        .eq('target_id', currentUser.id)
        .eq('status', 'Following') // They must be actively following
        .maybeSingle();

    const isTargetFollowingMe = !!reverseFollow;

    // 2. DETERMINE STATUS
    let newStatus = 'Following'; // Default for Public accounts

    // If Target is Private...
    if ((targetUser as any).isPrivate) {
        if (isTargetFollowingMe) {
            // MAGIC: They follow me -> TRUST ESTABLISHED -> Auto-Approve
            console.log("Trust Logic: Auto-approving follow request.");
            newStatus = 'Following'; 
        } else {
            // Standard Private Logic -> Send Request
            newStatus = 'Requested';
        }
    }

    // 3. INSERT INTO DATABASE
    const { error } = await supabase
      .from('follows')
      .insert({
        follower_id: currentUser.id,
        target_id: targetUser.id,
        status: newStatus
      });

    if (error) console.error('Error following user:', error);
    
    // Optimistic UI update could happen here if needed
  };

  const unfollowUser = async (userId: string) => {
    if (!currentUser) return;

    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', currentUser.id)
      .eq('target_id', userId);

    if (error) console.error('Error unfollowing user:', error);
  };

  const checkFollowStatus = async (userId: string): Promise<FollowStatus> => {
    if (!currentUser) return 'None';

    const { data } = await supabase
      .from('follows')
      .select('status')
      .eq('follower_id', currentUser.id)
      .eq('target_id', userId)
      .maybeSingle();

    return (data?.status as FollowStatus) || 'None';
  };

  // --- EXISTING FUNCTIONS ---

  const likePost = (postId: string) => {
    setPosts(prevPosts =>
      prevPosts.map(post =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likes: post.isLiked ? post.likes - 1 : post.likes + 1,
            }
          : post
      )
    );
  };

  const likeNote = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? {
              ...note,
              isLiked: !note.isLiked,
              likes: note.isLiked ? note.likes - 1 : note.likes + 1,
            }
          : note
      )
    );
  };

  const saveNote = (noteId: string) => {
    setNotes(prevNotes =>
      prevNotes.map(note =>
        note.id === noteId
          ? {
              ...note,
              isSaved: !note.isSaved,
              saves: note.isSaved ? note.saves - 1 : note.saves + 1,
            }
          : note
      )
    );
  };

  const addPost = (newPost: Omit<Post, 'id' | 'createdAt' | 'likes' | 'comments' | 'shares' | 'isLiked'>) => {
    const post: Post = {
      ...newPost,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0,
      comments: 0,
      shares: 0,
      isLiked: false,
    };
    setPosts(prevPosts => [post, ...prevPosts]);
  };

  const addNote = (newNote: Omit<Note, 'id' | 'createdAt' | 'likes' | 'saves' | 'isLiked' | 'isSaved'>) => {
    const note: Note = {
      ...newNote,
      id: Date.now().toString(),
      createdAt: new Date(),
      likes: 0,
      saves: 0,
      isLiked: false,
      isSaved: false,
    };
    setNotes(prevNotes => [note, ...prevNotes]);
  };

  const markNotificationAsRead = (notificationId: string) => {
    setNotifications(prevNotifications =>
      prevNotifications.map(notification =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        posts,
        notes,
        notifications,
        events,
        likePost,
        likeNote,
        saveNote,
        followUser,     // EXPORTED
        unfollowUser,   // EXPORTED
        checkFollowStatus, // EXPORTED
        addPost,
        addNote,
        markNotificationAsRead,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};