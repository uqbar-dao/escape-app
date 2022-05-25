import create from 'zustand';
import { persist } from 'zustand/middleware';
import { createStorageKey, storageVersion, clearStorageMigration } from '../util/landscape';

interface useChatStoreType {
  id: string;
  message: string;
  messageStore: Record<string, string>;
  restore: (id: string) => void;
  setMessage: (message: string) => void;
}

export const useChatStore = create<useChatStoreType>((set, get) => ({
  id: '',
  message: '',
  messageStore: {},
  restore: (id: string) => {
    const store = get().messageStore;
    set({
      id,
      messageStore: store,
      message: store[id] || ''
    });
  },
  setMessage: (message: string) => {
    console.log(5, message)
    const store = get().messageStore;
    store[get().id] = message;

    set({ message, messageStore: store });
  }
}));

interface ChatReply {
  link: string;
  content: string;
}

interface ChatReplyStore {
  id: string;
  reply: ChatReply;
  replyStore: Record<string, ChatReply>;
  restore: (id: string) => void;
  setReply: (link?: string, content?: string) => void;
}

export const useReplyStore = create<ChatReplyStore>((set, get) => ({
  id: '',
  reply: {
    link: '',
    content: ''
  },
  replyStore: {},
  restore: (id: string) => {
    const store = get().replyStore;
    set({
      id,
      reply: store[id] || { link: '', content: '' },
      replyStore: store
    });
  },
  setReply: (link = '', content = '') => {
    const reply = { link, content };
    const store = get().replyStore;
    store[get().id] = reply;

    set({ reply, replyStore: store });
  }
}));
