#!/usr/bin/env node
/**
 * Usage:
 *   node scripts/add-user.mjs <username> <name> <email> <password>
 *
 * Adds a new user to content/users/index.json with a bcrypt-hashed password.
 */

import { createRequire } from 'module';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

const USERS_FILE = resolve(__dirname, '../content/users/index.json');

function loadBcrypt() {
  for (const mod of ['bcryptjs', 'bcrypt']) {
    try { return require(mod); } catch {}
  }
  throw new Error('bcryptjs が見つかりません。yarn add -D bcryptjs を実行してください。');
}

async function prompt(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(question, ans => { rl.close(); resolve(ans.trim()); }));
}

async function promptHidden(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  process.stdout.write(question);
  return new Promise(resolve => {
    let input = '';
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (ch) => {
      if (ch === '\n' || ch === '\r' || ch === '') {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        process.stdout.write('\n');
        rl.close();
        resolve(input);
      } else if (ch === '') {
        process.exit();
      } else if (ch === '') {
        input = input.slice(0, -1);
      } else {
        input += ch;
      }
    });
  });
}

async function main() {
  const bcrypt = loadBcrypt();

  let [username, name, email, password] = process.argv.slice(2);

  if (!username) username = await prompt('ユーザー名: ');
  if (!name)     name     = await prompt('表示名: ');
  if (!email)    email    = await prompt('メールアドレス: ');
  if (!password) password = await promptHidden('パスワード: ');

  if (!username || !name || !email || !password) {
    console.error('エラー: すべてのフィールドが必要です。');
    process.exit(1);
  }

  const data = JSON.parse(readFileSync(USERS_FILE, 'utf8'));

  if (data.users.some(u => u.username === username)) {
    console.error(`エラー: ユーザー名 "${username}" は既に存在します。`);
    process.exit(1);
  }

  const hashed = await bcrypt.hash(password, 10);
  data.users.push({ username, name, email, password: hashed });

  writeFileSync(USERS_FILE, JSON.stringify(data, null, 2) + '\n', 'utf8');
  console.log(`ユーザー "${username}" を追加しました。`);
}

main().catch(err => { console.error(err.message); process.exit(1); });
