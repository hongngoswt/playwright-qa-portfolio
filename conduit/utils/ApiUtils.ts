import { APIRequestContext } from '@playwright/test';

const BASE_URL = 'https://api.realworld.show/api';

interface ArticleData {
  title: string;
  description: string;
  body: string;
  tagList?: string[];
}

interface Article {
  slug: string;
  title: string;
  description: string;
  body: string;
  tagList: string[];
  author: { username: string };
}

interface Comment {
  id: number;
  body: string;
  author: { username: string };
}

export class ApiUtils {
  constructor(private readonly request: APIRequestContext) {}

  async login(email: string, password: string): Promise<string> {
    const response = await this.request.post(`${BASE_URL}/users/login`, {
      data: { user: { email, password } },
    });
    const body = await response.json();
    return body.user.token;
  }

  async createArticle(token: string, data: ArticleData): Promise<Article> {
    const response = await this.request.post(`${BASE_URL}/articles`, {
      headers: { Authorization: `Token ${token}` },
      data: { article: data },
    });
    if (!response.ok()) {
      const text = await response.text().catch(() => '(unreadable)');
      throw new Error(`POST /articles ${response.status()}: ${text.substring(0, 300)}`);
    }
    const body = await response.json();
    return body.article;
  }

  async deleteArticle(token: string, slug: string): Promise<void> {
    await this.request.delete(`${BASE_URL}/articles/${slug}`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  async createComment(token: string, slug: string, commentBody: string): Promise<Comment> {
    const response = await this.request.post(`${BASE_URL}/articles/${slug}/comments`, {
      headers: { Authorization: `Token ${token}` },
      data: { comment: { body: commentBody } },
    });
    const body = await response.json();
    return body.comment;
  }

  async deleteComment(token: string, slug: string, commentId: number): Promise<void> {
    await this.request.delete(`${BASE_URL}/articles/${slug}/comments/${commentId}`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  async getArticles(limit: number = 10): Promise<Article[]> {
    const response = await this.request.get(`${BASE_URL}/articles?limit=${limit}`);
    const body = await response.json();
    return body.articles;
  }

  async favoriteArticle(token: string, slug: string): Promise<void> {
    await this.request.post(`${BASE_URL}/articles/${slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  async unfavoriteArticle(token: string, slug: string): Promise<void> {
    await this.request.delete(`${BASE_URL}/articles/${slug}/favorite`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  async followUser(token: string, username: string): Promise<void> {
    await this.request.post(`${BASE_URL}/profiles/${username}/follow`, {
      headers: { Authorization: `Token ${token}` },
    });
  }

  async unfollowUser(token: string, username: string): Promise<void> {
    await this.request.delete(`${BASE_URL}/profiles/${username}/follow`, {
      headers: { Authorization: `Token ${token}` },
    });
  }
}
