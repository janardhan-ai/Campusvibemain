import { Notification } from '../types';
import { users } from './users';

export const notifications: Notification[] = [
  {
    id: '1',
    type: 'like',
    user: users[1],
    message: 'Rahul liked your vibe',
    time: '2m ago',
    isRead: false,
  },
  {
    id: '2',
    type: 'follow',
    user: users[3],
    message: 'Sara started following you',
    time: '1h ago',
    isRead: false,
  },
  {
    id: '3',
    type: 'event',
    message: 'IIT Delhi TechFest 2024 starts tomorrow',
    time: '3h ago',
    isRead: true,
  },
  {
    id: '4',
    type: 'comment',
    user: users[4],
    message: 'Arjun commented on your post',
    time: '5h ago',
    isRead: true,
  },
  {
    id: '5',
    type: 'like',
    user: users[1],
    message: 'Rahul liked your note on DSP',
    time: '1d ago',
    isRead: true,
  },
];
