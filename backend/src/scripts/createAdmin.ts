import { User } from '../models';
import sequelize from '../config/database';

async function createTestUsers() {
  try {
    // データベース接続を確認
    await sequelize.authenticate();
    console.log('Database connection established.');

    // テーブルを同期
    await sequelize.sync();
    console.log('Database synced.');

    // テストユーザーを作成
    const users = [
      {
        name: '管理者',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin' as const,
        rank: 'platinum' as const,
        points: 10000,
      },
      {
        name: '看護師テスト',
        email: 'nurse@test.com',
        password: 'password123',
        role: 'nurse' as const,
        rank: 'silver' as const,
        points: 5000,
      },
      {
        name: '事務テスト',
        email: 'office@test.com',
        password: 'password123',
        role: 'office' as const,
        rank: 'bronze' as const,
        points: 3000,
      },
    ];

    for (const userData of users) {
      // 既存のユーザーをチェック
      const existingUser = await User.findOne({ where: { email: userData.email } });

      if (existingUser) {
        console.log(`ℹ️  User already exists: ${userData.email}`);
      } else {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email} (${userData.role}, ${userData.rank})`);
      }
    }

    console.log('\n📋 テストユーザー情報:');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('管理者: admin@test.com / password123');
    console.log('看護師: nurse@test.com / password123');
    console.log('事務員: office@test.com / password123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('Error creating test users:', error);
    process.exit(1);
  }
}

createTestUsers();
