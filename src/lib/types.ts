// Centralized type definitions
export type UserProfile = {
  display_name: string;
  profile_image_url: string | null;
  created_at: string;
  last_login_at: string | null;
};

export type User = {
  id: string;
  username: string;
  display_name: string;
  profile_image_url: string | null;
};

export type Thread = {
  id: string;
  title: string;
  created_by: string;
  author_name: string;
  comment_count: number;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type ThreadComment = {
  id: string;
  thread_id: string;
  author_id: string;
  author_name: string;
  title: string;
  body: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  read_by_me?: boolean;
  read_by_partner?: boolean;
};

export type TodoList = {
  id: string;
  title: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type TodoItem = {
  id: string;
  todo_list_id: string;
  title: string;
  done: boolean;
  done_by: string | null;
  done_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
};

// Backward-compatible alias: Entry is now a ThreadComment in the diary thread
export type Entry = ThreadComment;

export type EntryInput = {
  title: string;
  body: string;
  image_url?: string | null;
};
