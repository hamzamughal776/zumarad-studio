import test from 'node:test';
import assert from 'node:assert/strict';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(254),
  company: z.string().trim().max(120).optional().default(''),
  projectType: z.enum(['business-website','ecommerce','web-application','ui-ux','ai-integration','maintenance','other']),
  budget: z.enum(['not-sure','under-500','500-1500','1500-5000','5000-plus']),
  timeline: z.enum(['asap','2-4-weeks','1-3-months','flexible']),
  description: z.string().trim().min(20).max(4000),
  consent: z.literal(true),
  website: z.string().max(0).optional().default('')
});

const valid = {
  name: 'Demo Person', email: 'demo@example.com', company: 'Example Co',
  projectType: 'business-website', budget: 'not-sure', timeline: 'flexible',
  description: 'I need a responsive business website with service pages.',
  consent: true, website: ''
};

test('accepts a valid contact submission', () => {
  assert.equal(schema.safeParse(valid).success, true);
});
test('rejects invalid email addresses', () => {
  assert.equal(schema.safeParse({ ...valid, email: 'not-an-email' }).success, false);
});
test('rejects missing consent', () => {
  assert.equal(schema.safeParse({ ...valid, consent: false }).success, false);
});
test('rejects too-short descriptions', () => {
  assert.equal(schema.safeParse({ ...valid, description: 'short' }).success, false);
});
test('rejects filled honeypot field', () => {
  assert.equal(schema.safeParse({ ...valid, website: 'spam' }).success, false);
});
