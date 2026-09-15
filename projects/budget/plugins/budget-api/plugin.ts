import type { FastifyPluginAsync } from 'fastify';
import type {
  BudgetEconomicType,
  ClassificationInput,
  TransactionListFilters,
} from '../budget-store';

const economicTypes: readonly BudgetEconomicType[] = [
  'income',
  'expense',
  'transfer',
  'technical',
  'excluded',
  'card_repayment',
];
const economicTypeSet: ReadonlySet<string> = new Set(economicTypes);

interface TransactionQuerystring {
  year?: unknown;
  month?: unknown;
  accountId?: unknown;
  categoryId?: unknown;
  type?: unknown;
  page?: unknown;
  pageSize?: unknown;
}

interface TransactionParams {
  id: string;
}

interface ClassificationPayload {
  economicType?: unknown;
  categoryId?: unknown;
  legacySubtype?: unknown;
  confidence?: unknown;
  notes?: unknown;
  source?: unknown;
}

interface SummaryQuerystring {
  year?: unknown;
  month?: unknown;
}

interface BudgetApiOptions {
  ownerEmail?: string;
}

export const budgetApiPlugin: FastifyPluginAsync<BudgetApiOptions> = async function budgetApiPlugin(
  fastify,
  options,
) {
  const ownerEmail =
    options.ownerEmail ?? process.env.AUTH_INITIAL_USER_EMAIL ?? 'admin@rod-manager.local';
  const requireBudgetOwner = async (
    request: Parameters<typeof fastify.requireAuthenticatedSession>[0],
    reply: Parameters<typeof fastify.requireAuthenticatedSession>[1],
  ) => {
    await fastify.requireAuthenticatedSession(request, reply);
    if (
      request.authenticatedSession !== undefined &&
      request.authenticatedSession.userEmail.toLowerCase() !== ownerEmail.toLowerCase()
    ) {
      await reply.status(403).send({ message: 'Budget access is restricted to the owner.' });
    }
  };

  fastify.get<{ Querystring: TransactionQuerystring }>(
    '/api/transactions',
    { preHandler: requireBudgetOwner },
    async (request, reply) => {
      const filters = parseTransactionFilters(request.query);
      if (filters === undefined) {
        await reply.status(400).send({ message: 'Invalid transaction query.' });
        return;
      }
      await reply.send(fastify.budgetStore.listTransactions(filters));
    },
  );

  fastify.put<{ Params: TransactionParams; Body: ClassificationPayload }>(
    '/api/transactions/:id/classification',
    { preHandler: requireBudgetOwner },
    async (request, reply) => {
      const transaction = fastify.budgetStore.getBankTransaction(request.params.id);
      if (transaction === undefined) {
        await reply.status(404).send({ message: 'Transaction not found.' });
        return;
      }
      const payload = parseClassificationPayload(request.body);
      if (payload === undefined) {
        await reply.status(400).send({ message: 'Invalid classification payload.' });
        return;
      }
      const categoryId = payload.categoryId;
      if (
        typeof categoryId === 'string' &&
        fastify.budgetStore.getCategory(categoryId) === undefined
      ) {
        await reply.status(404).send({ message: 'Category not found.' });
        return;
      }

      const classification = fastify.budgetStore.classifyTransaction({
        transactionId: transaction.id,
        economicType: payload.economicType,
        categoryId: payload.categoryId,
        legacySubtype: payload.legacySubtype,
        confidence: payload.confidence,
        notes: payload.notes,
        source: 'manual',
      });
      await reply.send(classification);
    },
  );

  fastify.get('/api/accounts', { preHandler: requireBudgetOwner }, async (_request, reply) =>
    reply.send(fastify.budgetStore.listAccounts()),
  );

  fastify.get('/api/categories', { preHandler: requireBudgetOwner }, async (_request, reply) =>
    reply.send(fastify.budgetStore.listCategories()),
  );

  fastify.get<{ Querystring: SummaryQuerystring }>(
    '/api/reports/summary',
    { preHandler: requireBudgetOwner },
    async (request, reply) => {
      const period = parseReportPeriod(request.query);
      if (period === undefined) {
        await reply.status(400).send({ message: 'Invalid report period.' });
        return;
      }
      await reply.send(fastify.budgetStore.getReportSummary(period));
    },
  );
};

function parseTransactionFilters(
  query: TransactionQuerystring,
): TransactionListFilters | undefined {
  const year = parseYear(query.year, false);
  const month = parseMonth(query.month);
  const page = parsePositiveInteger(query.page, 1, 1_000_000);
  const pageSize = parsePositiveInteger(query.pageSize, 25, 100);
  if (year === INVALID || month === INVALID || page === INVALID || pageSize === INVALID) {
    return undefined;
  }
  if (!isOptionalString(query.accountId) || !isOptionalString(query.categoryId)) {
    return undefined;
  }
  if (query.type !== undefined && !isEconomicType(query.type)) {
    return undefined;
  }
  return {
    ...(year === undefined ? {} : { year }),
    ...(month === undefined ? {} : { month }),
    ...(query.accountId === undefined ? {} : { accountId: query.accountId }),
    ...(query.categoryId === undefined ? {} : { categoryId: query.categoryId }),
    ...(query.type === undefined ? {} : { economicType: query.type }),
    page,
    pageSize,
  };
}

function parseReportPeriod(
  query: SummaryQuerystring,
): { year: number; month: number | null } | undefined {
  const year = parseYear(query.year, true);
  const month = parseMonth(query.month);
  if (year === undefined || year === INVALID || month === INVALID) {
    return undefined;
  }
  return { year, month: month ?? null };
}

const INVALID = Symbol('invalid');

function parseYear(value: unknown, required: boolean): number | undefined | typeof INVALID {
  if (value === undefined) {
    return required ? INVALID : undefined;
  }
  if (typeof value !== 'string' || !/^\d{4}$/.test(value)) {
    return INVALID;
  }
  const year = Number(value);
  return year >= 1900 && year <= 9999 ? year : INVALID;
}

function parseMonth(value: unknown): number | null | undefined | typeof INVALID {
  if (value === undefined || value === 'null') {
    return value === undefined ? undefined : null;
  }
  if (typeof value !== 'string' || !/^\d{1,2}$/.test(value)) {
    return INVALID;
  }
  const month = Number(value);
  return month >= 1 && month <= 12 ? month : INVALID;
}

function parsePositiveInteger(
  value: unknown,
  fallback: number,
  maximum: number,
): number | typeof INVALID {
  if (value === undefined) {
    return fallback;
  }
  if (typeof value !== 'string' || !/^\d+$/.test(value)) {
    return INVALID;
  }
  const parsed = Number(value);
  return parsed >= 1 && parsed <= maximum ? parsed : INVALID;
}

function isOptionalString(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === 'string' && value.trim().length > 0);
}

function isEconomicType(value: unknown): value is BudgetEconomicType {
  return typeof value === 'string' && economicTypeSet.has(value);
}

function parseClassificationPayload(
  payload: ClassificationPayload,
): Omit<ClassificationInput, 'transactionId' | 'source'> | undefined {
  if (typeof payload !== 'object' || payload === null || Array.isArray(payload)) {
    return undefined;
  }
  if ('source' in payload) {
    return undefined;
  }
  if (!isEconomicType(payload.economicType)) {
    return undefined;
  }
  const categoryId =
    payload.categoryId === undefined || payload.categoryId === null
      ? null
      : typeof payload.categoryId === 'string' && payload.categoryId.trim().length > 0
        ? payload.categoryId
        : undefined;
  if (categoryId === undefined) {
    return undefined;
  }
  const legacySubtype = parseNullableString(payload.legacySubtype);
  const notes = parseNullableString(payload.notes);
  if (legacySubtype === INVALID || notes === INVALID) {
    return undefined;
  }
  const confidence =
    payload.confidence === undefined || payload.confidence === null
      ? null
      : typeof payload.confidence === 'number' &&
          Number.isFinite(payload.confidence) &&
          payload.confidence >= 0 &&
          payload.confidence <= 1
        ? payload.confidence
        : undefined;
  if (confidence === undefined) {
    return undefined;
  }
  return { economicType: payload.economicType, categoryId, legacySubtype, confidence, notes };
}

function parseNullableString(value: unknown): string | null | typeof INVALID {
  if (value === undefined || value === null) {
    return null;
  }
  return typeof value === 'string' ? value : INVALID;
}
