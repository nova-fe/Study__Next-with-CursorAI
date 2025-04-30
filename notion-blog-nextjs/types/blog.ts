export interface TagFilterItem {
  id: string;
  name: string;
  count: number;
}

export interface Post {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  tags?: string[];
  author?: string;
  authorAvatar?: string;
  date?: string;
  modifiedDate?: string;
  slug: string;
}
