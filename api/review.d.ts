export type ReviewRequest = { method?: string; body?: unknown; headers: Record<string, string | undefined> };
export type ReviewResponse = { status: (code: number) => ReviewResponse; json: (body: unknown) => void; setHeader: (name: string, value: string) => void };

export function createReviewHandler(options?: {
  env?: Record<string, string | undefined>;
  fetchImpl?: typeof fetch;
}): (request: ReviewRequest, response: ReviewResponse) => Promise<void>;

declare const handler: ReturnType<typeof createReviewHandler>;
export default handler;
