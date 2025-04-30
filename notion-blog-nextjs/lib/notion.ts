import { Client } from '@notionhq/client';
import { Post } from '@/types/blog';
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

export async function getPublishedPosts(): Promise<Post[]> {
  const response = await notion.databases.query({
    database_id: process.env.NOTION_DATABASE_ID!,
    filter: {
      property: 'Status',
      select: {
        equals: 'Published',
      },
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
}
