import { Timestamp } from "firebase/firestore";

export interface Post {
  user_id: string;
  username: string;
  type: "image" | "note";
  text?: string;
  image_url?: string;
  created_date: Timestamp;
  is_active: boolean;
}
