import { Client } from '@notionhq/client';
import { Post, TagFilterItem } from '@/types/blog';
import {
  PageObjectResponse,
  PersonUserObjectResponse,
  RichTextItemResponse,
} from '@notionhq/client/build/src/api-endpoints';

type DateResponse = {
  start: string;
  end: string | null;
  time_zone: string | null;
};

type NotionFile =
  | {
      type: 'external';
      external: {
        url: string;
      };
    }
  | {
      type: 'file';
      file: {
        url: string;
        expiry_time: string;
      };
    };

const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

export const getTags = async (): Promise<TagFilterItem[]> => {
  const posts = await getPublishedPosts();

  // 모든 태그를 추출하고 각 태그의 출현 횟수를 계산
  const tagCount = posts.reduce(
    (acc, post) => {
      post.tags?.forEach((tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
      });
      return acc;
    },
    {} as Record<string, number>
  );

  // TagFilterItem 형식으로 변환
  const tags: TagFilterItem[] = Object.entries(tagCount).map(([name, count]) => ({
    id: name,
    name,
    count,
  }));

  // "전체" 태그 추가
  tags.unshift({
    id: 'all',
    name: '전체',
    count: posts.length,
  });

  // 태그 이름 기준으로 정렬 ("전체" 태그는 항상 첫 번째에 위치하도록 제외)
  const [allTag, ...restTags] = tags;
  const sortedTags = restTags.sort((a, b) => a.name.localeCompare(b.name));

  return [allTag, ...sortedTags];
};

export const getPublishedPosts = async (tag?: string): Promise<Post[]> => {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      and: [
        {
          property: 'Status',
          select: {
            equals: 'Published',
          },
        },
        ...(tag && tag !== '전체'
          ? [
              {
                property: 'Tags',
                multi_select: {
                  contains: tag,
                },
              },
            ]
          : []),
      ],
    },
    sorts: [
      {
        property: 'Modified Date', // 수정일로 정렬
        direction: 'descending',
      },
    ],
  });

  return response.results.map((page) => {
    if (!('properties' in page)) {
      throw new Error('Invalid page response');
    }

    const properties = page.properties;
    const title = properties.Title as { title: RichTextItemResponse[] };
    const description = properties.Description as { rich_text: RichTextItemResponse[] };
    const date = properties.Date as { date: DateResponse };
    const slug = properties.Slug as { rich_text: RichTextItemResponse[] };
    const tags = properties.Tags as { multi_select: { name: string }[] };
    const author = properties.Author as { people: PersonUserObjectResponse[] };

    const pageResponse = page as PageObjectResponse;
    const cover = pageResponse.cover as NotionFile | null;
    let coverImage: string | undefined;

    if (cover) {
      if (cover.type === 'external') {
        coverImage = cover.external.url;
      } else if (cover.type === 'file') {
        coverImage = cover.file.url;
      }
    }

    return {
      id: page.id,
      title: title.title[0].plain_text,
      description: description.rich_text[0].plain_text,
      date: date.date.start,
      modifiedDate: date.date.end ?? undefined,
      slug: slug.rich_text[0].plain_text,
      tags: tags.multi_select.map((tag) => tag.name),
      author: author.people?.[0]?.name ?? 'Unknown Author',
      authorAvatar: author.people?.[0]?.avatar_url ?? undefined,
      coverImage,
    };
  });
};
