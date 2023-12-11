// utils.ts

export function normalizeHtml (html: string) {
  return html
    .replace(/\n/g, '')
    .replace(/[\t ]+\</g, '<')
    .replace(/\>[\t ]+\</g, '><')
    .replace(/\>[\t ]+$/g, '>')
  ;
}

const fnCache: Record<string, Function> = {};

export function createFunction (...args: any[]) {
  const key = args.join('$');
  return fnCache[key] ?? (fnCache[key] = new Function(...args));
};

const ITEM = Symbol();
const rx = /(this\.[\w+|\d*]*)+/gi;
const ix = /item(\.[\w+|\d*]*)*/gi;
const stripCurlies = /(\{\{([^\{|^\}]+)\}\})/gi;
const methodPattern = /(?:this\.)(\w+)\((.*?)\)/g;

export function parseExpression (expression: string = '') {
  const paths = [];
  let match = null;
  rx.lastIndex = ix.lastIndex = 0;
  while ((match = rx.exec(expression))) {
    paths.push(match[1].split('.')[1]);
  }
  if (ix.test(expression)) {
    paths.push(ITEM);
  }
  const matches = expression.matchAll(methodPattern);
  const methods: { method: string, arguments: any[] }[] = [];

  for (const match of matches) {
    const methodName = match[1];
    const argsStr = match[2];
    const args = argsStr.split(',').map(arg => arg.trim());
    const parsedArgs = args.map(arg => {
      // Identifier si l'argument est une chaîne ou un identifiant
      return arg.startsWith('this.') ? arg.slice(5) : arg;
    });

    methods.push({ method: methodName, arguments: parsedArgs });
  }
  return {
    paths,
    expressions: (paths.length ? expression.match(stripCurlies) ?? [] : []) as RegExpMatchArray,
    methods,
  };
}