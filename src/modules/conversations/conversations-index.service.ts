import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { ConversationMode } from './dto/conversation.dto';

export interface ConversationMeta {
  id: string;
  title: string;
  mode: ConversationMode;
  useHistory: boolean;
  messageCount: number;
  createdAt: string;
  updatedAt: string;
}

interface ConversationsIndex {
  conversations: ConversationMeta[];
}

/**
 * Gestion de l'index JSON des conversations sur disque.
 * Responsabilité unique : persistance des métadonnées (pas des messages).
 */
@Injectable()
export class ConversationsIndexService {
  readonly indexPath: string;

  constructor() {
    this.indexPath = path.resolve(process.cwd(), 'data', 'conversations.json');
    this.ensureIndex();
  }

  private ensureIndex(): void {
    const dir = path.dirname(this.indexPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    if (!fs.existsSync(this.indexPath)) this.write({ conversations: [] });
  }

  read(): ConversationsIndex {
    try {
      return JSON.parse(fs.readFileSync(this.indexPath, 'utf-8'));
    } catch {
      return { conversations: [] };
    }
  }

  write(index: ConversationsIndex): void {
    fs.writeFileSync(this.indexPath, JSON.stringify(index, null, 2), 'utf-8');
  }

  findOne(id: string): ConversationMeta | undefined {
    return this.read().conversations.find(c => c.id === id);
  }

  upsert(meta: ConversationMeta): void {
    const index = this.read();
    const pos = index.conversations.findIndex(c => c.id === meta.id);
    if (pos >= 0) {
      index.conversations[pos] = meta;
    } else {
      index.conversations.unshift(meta); // plus récent en premier
    }
    this.write(index);
  }

  remove(id: string): void {
    const index = this.read();
    index.conversations = index.conversations.filter(c => c.id !== id);
    this.write(index);
  }
}
