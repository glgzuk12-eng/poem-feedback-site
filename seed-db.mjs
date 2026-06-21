import { readFileSync } from 'fs';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

function slugify(text, index) {
  // Simple slug: use index + romanized name or title
  return `${index}`;
}

function makeAuthorSlug(name, index) {
  const slugMap = {
    '김승욱': 'kim-seungwook',
    '이민서': 'lee-minseo',
    '강정모': 'kang-jeongmo',
    '김서율': 'kim-seoyul',
    '김희주': 'kim-heeju',
    '안희찬': 'ahn-heechan',
    '윤채진': 'yoon-chaejin',
    '이수인': 'lee-sooin',
    '이시안': 'lee-sian',
    '장영은': 'jang-youngeun',
    '정환길': 'jeong-hwangil',
    '하정윤': 'ha-jeongyoon',
  };
  return slugMap[name] || `author-${index}`;
}

function makeWorkSlug(title, authorSlug, index) {
  // Use a simple numeric slug with author prefix
  const clean = title.toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
  return `${authorSlug}-${index}-${clean || 'work'}`;
}

async function main() {
  const data = JSON.parse(readFileSync('/home/ubuntu/poems_structured.json', 'utf-8'));
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    // Clear existing data
    await connection.execute('DELETE FROM comments');
    await connection.execute('DELETE FROM works');
    await connection.execute('DELETE FROM authors');
    
    // Insert authors
    for (let i = 0; i < data.length; i++) {
      const author = data[i];
      const slug = makeAuthorSlug(author.author, i);
      
      await connection.execute(
        'INSERT INTO authors (name, slug, sortOrder) VALUES (?, ?, ?)',
        [author.author, slug, i + 1]
      );
      
      // Get the inserted author ID
      const [rows] = await connection.execute(
        'SELECT id FROM authors WHERE slug = ?',
        [slug]
      );
      const authorId = rows[0].id;
      
      // Insert works
      for (let j = 0; j < author.works.length; j++) {
        const work = author.works[j];
        const workSlug = makeWorkSlug(work.title, slug, j);
        
        await connection.execute(
          'INSERT INTO works (authorId, title, slug, type, content, sortOrder) VALUES (?, ?, ?, ?, ?, ?)',
          [authorId, work.title, workSlug, work.type, work.content, j + 1]
        );
      }
      
      console.log(`✓ ${author.author}: ${author.works.length} works inserted`);
    }
    
    console.log('\n=== Seeding complete ===');
    
    // Verify
    const [authorCount] = await connection.execute('SELECT COUNT(*) as cnt FROM authors');
    const [workCount] = await connection.execute('SELECT COUNT(*) as cnt FROM works');
    console.log(`Authors: ${authorCount[0].cnt}, Works: ${workCount[0].cnt}`);
    
  } finally {
    await connection.end();
  }
}

main().catch(console.error);
