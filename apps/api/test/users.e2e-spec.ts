import type { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import type { Pool } from 'pg';
import request from 'supertest';
import type { App } from 'supertest/types';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { configureApp } from '../src/setup-app.js';
import { hashPassword } from '../src/users/password.util.js';

describe('Users (e2e)', () => {
  let app: INestApplication<App>;
  let sessionPool: Pool;
  let prisma: PrismaService;
  let workspaceId: string;
  let adminId: string;
  let associateId: string;

  const ADMIN_EMAIL = 'admin@users-e2e.test';
  const ADMIN_PASSWORD = 'admin-password-123';
  const ASSOCIATE_EMAIL = 'associate@users-e2e.test';
  const ASSOCIATE_PASSWORD = 'associate-password-123';

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    sessionPool = configureApp(app);
    await app.init();

    prisma = app.get(PrismaService);
    const workspace = await prisma.workspace.create({
      data: { name: `Users e2e ${Date.now()}` },
    });
    workspaceId = workspace.id;

    const admin = await prisma.user.create({
      data: {
        workspaceId,
        email: ADMIN_EMAIL,
        passwordHash: await hashPassword(ADMIN_PASSWORD),
        role: 'ADMIN',
      },
    });
    adminId = admin.id;
    const associate = await prisma.user.create({
      data: {
        workspaceId,
        email: ASSOCIATE_EMAIL,
        passwordHash: await hashPassword(ASSOCIATE_PASSWORD),
        role: 'ASSOCIATE',
      },
    });
    associateId = associate.id;
  });

  afterEach(async () => {
    // The Session table has no FK to User, so logged-in-session rows from
    // this test (and any newly-created user created via POST /users) would
    // otherwise outlive the users/workspace below and just sit there until
    // they naturally expire.
    const testUserIds = await prisma.user
      .findMany({ where: { workspaceId }, select: { id: true } })
      .then((users) => users.map((u) => u.id).concat(adminId, associateId));
    await prisma.session.deleteMany({
      where: {
        OR: testUserIds.map((id) => ({
          sess: { path: ['passport', 'user'], equals: id },
        })),
      },
    });
    await prisma.user.deleteMany({ where: { workspaceId } });
    await prisma.workspace.delete({ where: { id: workspaceId } });
    await sessionPool.end();
    await app.close();
  });

  function loginAs(email: string, password: string) {
    const agent = request.agent(app.getHttpServer());
    return agent
      .post('/api/auth/login')
      .send({ workspaceId, email, password })
      .expect(200)
      .then(() => agent);
  }

  it('lets an admin create a new user scoped to their own workspace', async () => {
    const agent = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

    const response = await agent
      .post('/api/users')
      .send({
        email: 'newrep@users-e2e.test',
        password: 'newrep-password-123',
        role: 'ASSOCIATE',
      })
      .expect(201);

    expect(response.body).toMatchObject({
      email: 'newrep@users-e2e.test',
      role: 'ASSOCIATE',
      workspaceId,
    });
    expect(response.body.passwordHash).toBeUndefined();
  });

  it('lets an admin list users in their own workspace', async () => {
    const agent = await loginAs(ADMIN_EMAIL, ADMIN_PASSWORD);

    const response = await agent.get('/api/users').expect(200);

    expect(response.body).toHaveLength(2);
    expect(response.body.map((u: { email: string }) => u.email).sort()).toEqual(
      [ADMIN_EMAIL, ASSOCIATE_EMAIL].sort(),
    );
  });

  it('forbids an associate from hitting the admin-only users routes', async () => {
    const agent = await loginAs(ASSOCIATE_EMAIL, ASSOCIATE_PASSWORD);

    await agent.get('/api/users').expect(403);
    await agent
      .post('/api/users')
      .send({ email: 'x@users-e2e.test', password: 'password-123', role: 'ASSOCIATE' })
      .expect(403);
  });

  it('rejects an unauthenticated request', async () => {
    await request(app.getHttpServer()).get('/api/users').expect(401);
  });
});
