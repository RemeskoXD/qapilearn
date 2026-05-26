import fs from 'fs';

const data = JSON.parse(fs.readFileSync('caflou_api.json', 'utf-8'));

function extractUrls(node: any, paths: Set<string>) {
  if (node.request && node.request.urlObject && node.request.urlObject.path) {
    paths.add('/' + node.request.urlObject.path.join('/'));
  } else if (node.request && typeof node.request.url === 'string') {
    paths.add(node.request.url);
  } else if (node.request && node.request.url && node.request.url.raw) {
    paths.add(node.request.url.raw);
  }

  if (node.item) {
    node.item.forEach((i: any) => extractUrls(i, paths));
  }
}

const paths = new Set<string>();
extractUrls(data, paths);

console.log(Array.from(paths).slice(0, 30));
