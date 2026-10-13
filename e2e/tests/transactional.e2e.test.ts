import { TransactionalService } from '@jchpro/nest-mongoose';
import { BadRequestException, Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { InjectConnection, InjectModel, MongooseModule, Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { type Connection, type Model } from 'mongoose';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createApp, type TestApp } from './helpers/app.js';
import { uniqueDatabaseUri } from './helpers/mongo.js';

@Schema()
class Account {
  @Prop({ required: true, unique: true })
  owner!: string;

  @Prop({ required: true })
  balance!: number;
}

const AccountSchema = SchemaFactory.createForClass(Account);

@Schema()
class AuditEntry {
  @Prop({ required: true })
  text!: string;
}

const AuditEntrySchema = SchemaFactory.createForClass(AuditEntry);

interface TransferBody {
  from: string;
  to: string;
  amount: number;
  /** Fail after the debit, to see the rollback. */
  failAfterDebit?: boolean;
  /** Write the audit entry without the session, which the transaction can't take back. */
  auditWithoutSession?: boolean;
}

@Injectable()
class BankService extends TransactionalService {
  constructor(
    @InjectConnection() connection: Connection,
    @InjectModel(Account.name) private readonly accounts: Model<Account>,
    @InjectModel(AuditEntry.name) private readonly audit: Model<AuditEntry>,
  ) {
    super(connection);
  }

  transfer(body: TransferBody) {
    return this.transactional(async (session) => {
      const debited = await this.accounts.updateOne(
        { owner: body.from, balance: { $gte: body.amount } },
        { $inc: { balance: -body.amount } },
        { session },
      );
      if (!debited.modifiedCount) {
        throw new BadRequestException('Insufficient funds');
      }
      if (body.auditWithoutSession) {
        await this.audit.create({ text: `${body.from} -> ${body.to}` });
      } else {
        await this.audit.create([{ text: `${body.from} -> ${body.to}` }], { session });
      }
      if (body.failAfterDebit) {
        throw new BadRequestException('Failed after the debit');
      }
      await this.accounts.updateOne({ owner: body.to }, { $inc: { balance: body.amount } }, { session });
      return { transferred: body.amount };
    });
  }
}

@Controller('transfers')
class BankController {
  constructor(private readonly bank: BankService) {}

  @Post()
  transfer(@Body() body: TransferBody) {
    return this.bank.transfer(body);
  }
}

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Account.name, schema: AccountSchema },
      { name: AuditEntry.name, schema: AuditEntrySchema },
    ]),
  ],
  controllers: [BankController],
  providers: [BankService],
})
class BankModule {}

describe('TransactionalService', () => {
  let testApp: TestApp;
  let accounts: Model<Account>;
  let audit: Model<AuditEntry>;

  beforeAll(async () => {
    testApp = await createApp({ imports: [MongooseModule.forRoot(uniqueDatabaseUri('transactional')), BankModule] });
    accounts = testApp.app.get(`${Account.name}Model`);
    audit = testApp.app.get(`${AuditEntry.name}Model`);
    // Collections have to exist before a transaction writes to them
    await Promise.all([accounts.createCollection(), audit.createCollection()]);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  beforeEach(async () => {
    await accounts.deleteMany({});
    await audit.deleteMany({});
    await accounts.create([
      { owner: 'ann', balance: 100 },
      { owner: 'bob', balance: 10 },
    ]);
  });

  const balances = async () => {
    const docs = await accounts.find().sort({ owner: 1 });
    return Object.fromEntries(docs.map((doc) => [doc.owner, doc.balance]));
  };

  it('commits all the writes of the callback and returns its result', async () => {
    const res = await testApp.http.post('/transfers').send({ from: 'ann', to: 'bob', amount: 30 });

    expect(res.status).toBe(201);
    expect(res.body).toEqual({ transferred: 30 });
    expect(await balances()).toEqual({ ann: 70, bob: 40 });
    expect(await audit.countDocuments()).toBe(1);
  });

  it('rolls back the writes which got the session when the callback throws', async () => {
    const res = await testApp.http.post('/transfers').send({ from: 'ann', to: 'bob', amount: 30, failAfterDebit: true });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Failed after the debit');
    expect(await balances()).toEqual({ ann: 100, bob: 10 });
    expect(await audit.countDocuments()).toBe(0);
  });

  it('propagates the error of a callback which fails on the first step, with nothing written', async () => {
    const res = await testApp.http.post('/transfers').send({ from: 'bob', to: 'ann', amount: 50 });

    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Insufficient funds');
    expect(await balances()).toEqual({ ann: 100, bob: 10 });
  });

  it('does not take back a write which was made without the session', async () => {
    const res = await testApp.http
      .post('/transfers')
      .send({ from: 'ann', to: 'bob', amount: 30, failAfterDebit: true, auditWithoutSession: true });

    expect(res.status).toBe(400);
    expect(await balances()).toEqual({ ann: 100, bob: 10 });
    // Committed on its own, right away
    expect(await audit.countDocuments()).toBe(1);
  });
});
