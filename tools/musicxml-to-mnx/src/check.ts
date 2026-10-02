import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import Ajv2020, { type ErrorObject } from 'ajv/dist/2020.js';

const SCHEMA_PATH = createRequire(import.meta.url).resolve('@polyhymnia/mnx/schema');

let validateSchema: ((doc: unknown) => boolean) & { errors?: ErrorObject[] | null };

function getValidator(): typeof validateSchema {
  if (!validateSchema) {
    const ajv = new Ajv2020({ strict: false, allErrors: true });
    const schema = JSON.parse(readFileSync(SCHEMA_PATH, 'utf8'));
    validateSchema = ajv.compile(schema) as typeof validateSchema;
  }
  return validateSchema;
}

export interface CheckResult {
  ok: boolean;
  problems: string[];
}

export function check(doc: unknown): CheckResult {
  const validate = getValidator();
  if (validate(doc)) return { ok: true, problems: [] };
  const problems = (validate.errors ?? []).map((error) => `${error.instancePath || '/'} ${error.message ?? ''}`.trim());
  return { ok: false, problems };
}
