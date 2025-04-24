export interface User {
  _id: string;
  email: string;
  auth0Id: string;
  avatar: string;
  name: string;
  role: 'admin' | 'client';
  createdAt: Date;
  updatedAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  company: string;
  phone: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  clientId: string;
  createdAt: string;
}

export interface File {
  id: string;
  name: string;
  size: number;
  type: string;
  folderId: string;
  uploadedBy: string;
  createdAt: string;
  url: string;
}

export interface Message {
  _id: string;
  content: string;
  sender: string;
  receiver: string;
  createdAt: string;
  read: boolean;
  type: string;
}