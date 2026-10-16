export type Profile = {
  username: string;
};

export type Option = {
  id: string;
  text: string;
  image_url: string | null;
  position: number;
};

export type Poll = {
  id: string;
  question: string;
  created_at: string;
  user_id: string;
  profiles: Profile | null;
  options: Option[];
};

export type Vote = {
  poll_id: string;
  option_id: string;
};

export type OptionVoteCount = {
  option_id: string;
  poll_id: string;
  vote_count: number;
};
