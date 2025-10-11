import * as path from 'node:path';
import * as fs from 'node:fs';
import Handlebars from 'handlebars';

export const MAIL_FROM = process.env.MAIL_FROM!;
export const TEMPLATE_ROOT = path.resolve(
  process.cwd(),
  'src/modules/mail/templates',
);

export function registerHandlebarsHelpers() {
  // Helper: {{upper value}}
  Handlebars.registerHelper('upper', (v: unknown) =>
    String(v ?? '').toUpperCase(),
  );
  // Helper: {{lower value}}
  Handlebars.registerHelper('lower', (v: unknown) =>
    String(v ?? '').toLowerCase(),
  );
  // Helper: {{ifEq a b}}...{{/ifEq}}
  Handlebars.registerHelper(
    'ifEq',
    function (this: any, a: any, b: any, options: any) {
      return a === b ? options.fn(this) : options.inverse(this);
    },
  );
}

export function loadFile(filePath: string) {
  return fs.readFileSync(filePath, 'utf8');
}
