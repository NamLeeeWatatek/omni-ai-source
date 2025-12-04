/**
 * Quick debug script để kiểm tra conversations
 * Chạy: npx ts-node quick-debug.ts
 */

import { DataSource } from 'typeorm';

async function debug() {
  // Kết nối database
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT || '5432'),
    username: process.env.DATABASE_USERNAME || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'admin',
    database: process.env.DATABASE_NAME || 'wataomi',
  });

  await dataSource.initialize();
  console.log('✅ Connected to database\n');

  try {
    // 1. Tổng số conversations
    const totalConversations = await dataSource.query(
      'SELECT COUNT(*) as count FROM conversation WHERE deleted_at IS NULL'
    );
    console.log('📊 Total conversations:', totalConversations[0].count);

    // 2. Conversations theo channelType
    const byChannelType = await dataSource.query(`
      SELECT channel_type, COUNT(*) as count 
      FROM conversation 
      WHERE deleted_at IS NULL 
      GROUP BY channel_type
    `);
    console.log('\n📊 Conversations by channel type:');
    byChannelType.forEach((row: any) => {
      console.log(`  - ${row.channel_type}: ${row.count}`);
    });

    // 3. Conversations có channelId
    const withChannelId = await dataSource.query(
      'SELECT COUNT(*) as count FROM conversation WHERE channel_id IS NOT NULL AND deleted_at IS NULL'
    );
    console.log('\n📊 Conversations with channelId:', withChannelId[0].count);

    // 4. Conversations từ Facebook
    const facebookConversations = await dataSource.query(`
      SELECT 
        c.id,
        c.channel_type,
        c.channel_id,
        c.contact_name,
        c.external_id,
        c.status,
        b.name as bot_name,
        b.workspace_id
      FROM conversation c
      LEFT JOIN bot b ON b.id = c.bot_id
      WHERE c.channel_type = 'facebook' 
        AND c.deleted_at IS NULL
      LIMIT 5
    `);
    console.log('\n📊 Facebook conversations (latest 5):');
    if (facebookConversations.length === 0) {
      console.log('  ❌ No Facebook conversations found!');
    } else {
      facebookConversations.forEach((conv: any) => {
        console.log(`  - ID: ${conv.id}`);
        console.log(`    Contact: ${conv.contact_name}`);
        console.log(`    External ID: ${conv.external_id}`);
        console.log(`    Channel ID: ${conv.channel_id}`);
        console.log(`    Bot: ${conv.bot_name} (workspace: ${conv.workspace_id})`);
        console.log(`    Status: ${conv.status}`);
        console.log('');
      });
    }

    // 5. Channel connections
    const channels = await dataSource.query(`
      SELECT id, name, type, metadata
      FROM channel_connection
      LIMIT 5
    `);
    console.log('\n📊 Channel connections (latest 5):');
    if (channels.length === 0) {
      console.log('  ❌ No channels found!');
    } else {
      channels.forEach((ch: any) => {
        console.log(`  - ID: ${ch.id}`);
        console.log(`    Name: ${ch.name}`);
        console.log(`    Type: ${ch.type}`);
        console.log(`    Metadata:`, JSON.stringify(ch.metadata, null, 2));
        console.log('');
      });
    }

    // 6. Test query giống như API
    console.log('\n📊 Testing API query (source=channel&channelType=facebook):');
    const apiQuery = await dataSource.query(`
      SELECT 
        c.id,
        c.bot_id,
        c.channel_type,
        c.channel_id,
        c.contact_name,
        c.external_id,
        c.status,
        b.name as bot_name,
        b.workspace_id
      FROM conversation c
      LEFT JOIN bot b ON b.id = c.bot_id
      WHERE c.deleted_at IS NULL
        AND c.channel_id IS NOT NULL
        AND c.channel_type = 'facebook'
      LIMIT 20
    `);
    console.log(`  Found ${apiQuery.length} conversations`);
    if (apiQuery.length > 0) {
      console.log('  ✅ Query works! Sample:');
      console.log(`    - ${apiQuery[0].contact_name} (${apiQuery[0].external_id})`);
      console.log(`    - Bot workspace: ${apiQuery[0].workspace_id}`);
    } else {
      console.log('  ❌ Query returned empty!');
      console.log('\n  Possible reasons:');
      console.log('    1. No conversations with channelId');
      console.log('    2. No conversations with channelType=facebook');
      console.log('    3. All conversations are deleted');
    }

    // 7. Check users and their workspaces
    console.log('\n📊 Users:');
    const users = await dataSource.query(`
      SELECT id, email, first_name, last_name
      FROM "user"
      ORDER BY created_at DESC
      LIMIT 5
    `);
    users.forEach((user: any) => {
      console.log(`  - ${user.email} (ID: ${user.id})`);
    });

    // 8. Check if workspace filter is the issue
    const workspaceId = 'f490f842-c735-4dee-80d1-79d9709fdfb4'; // From the bot above
    console.log(`\n📊 Testing with workspace filter (${workspaceId}):`);
    const withWorkspace = await dataSource.query(`
      SELECT 
        c.id,
        c.contact_name,
        b.name as bot_name,
        b.workspace_id
      FROM conversation c
      LEFT JOIN bot b ON b.id = c.bot_id
      WHERE c.deleted_at IS NULL
        AND c.channel_id IS NOT NULL
        AND c.channel_type = 'facebook'
        AND b.workspace_id = $1
      LIMIT 20
    `, [workspaceId]);
    console.log(`  Found ${withWorkspace.length} conversations with workspace filter`);
    
    if (withWorkspace.length === 0) {
      console.log('  ⚠️  Workspace filter is blocking results!');
      console.log('  This means the user calling the API has a different workspaceId');
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await dataSource.destroy();
    console.log('\n✅ Disconnected from database');
  }
}

debug().catch(console.error);
