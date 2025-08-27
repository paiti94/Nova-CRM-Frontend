// client/src/types/task.ts (or wherever your front-end Task interfaces live)

export interface Task {
  _id: string;
  title: string;
  description: string;
  status: 'pending' | 'in_progress' | 'completed';
  // NEW: align with backend
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string | Date;

  createdAt: string | Date;
  updatedAt: string | Date;

  // Backend uses array of ObjectIds
  assignedTo: string[];             // was: string
  createdBy: string;

  attachments?: TaskAttachment[];
  comments?: TaskComment[];

  // NEW: Outlook/source metadata (optional)
  source?: 'manual' | 'outlook';
  sourceEmailId?: string;     // Graph message id
  sourceThreadId?: string;    // Graph conversationId
  sourceWebLink?: string;     // Outlook web link
  sourceFromName?: string;
  sourceFromAddress?: string;
  sourceReceivedAt?: string | Date;
  sourceSubject?: string;
  sourceSnippet?: string;     // cleaned excerpt sent to AI
}

export interface TaskAttachment {
  _id: string;
  fileName: string;
  fileUrl: string;
  uploadedAt: string | Date;
  uploadedBy: string;
}

export interface TaskComment {
  _id: string;
  content: string;
  createdAt: string | Date;
  user: {
    username?: string; 
    _id: string;
    name?: string; // in case you populate 'name' instead of 'username'
  };
  updatedAt?: string | Date;
}
