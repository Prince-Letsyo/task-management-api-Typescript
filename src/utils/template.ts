// src/utils/template.ts
import * as fs from 'fs';
import * as path from 'path';
import * as Handlebars from 'handlebars';
import { config } from '../config/index';

const templatesDir = path.join(__dirname, '../templates');

// Cache compiled templates
const cache = new Map<string, HandlebarsTemplateDelegate>();

export const loadTemplate = (name: string): HandlebarsTemplateDelegate => {
  if (cache.has(name)) {
    return cache.get(name)!;
  }

  const filePath = path.join(templatesDir, `${name}.hbs`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const template = Handlebars.compile(source);
  cache.set(name, template);
  return template;
};

// Pre-load layout
const layoutSource = fs.readFileSync(
  path.join(templatesDir, 'layouts/email-layout.hbs'),
  'utf-8'
);
const layout = Handlebars.compile(layoutSource);

// Helper: render with layout
export const renderWithLayout = (bodyTemplate: string, data: any) => {
  const body = loadTemplate(`emails/${bodyTemplate}`)(data);
  return layout({
    ...data,
    body,
    year: new Date().getFullYear(),
    appName: config.appName || 'YourApp',
    unsubscribeUrl:
      process.env.UNSUBSCRIBE_URL || 'https://yourapp.com/unsubscribe',
  });
};
