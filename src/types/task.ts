export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  createdAt: Date;
  updatedAt: Date;
  assignedTo: string;
  createdBy: string;
  attachments?: TaskAttachment[];
  comments?: TaskComment[];
}

export interface TaskAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: Date;
  uploadedBy: string;
}

export interface TaskComment {
  _id: string;
  content: string;
  createdAt: Date;
//   createdBy: string;
user: {
    username: string; 
    _id: string;
  }
  updatedAt?: Date;
} 