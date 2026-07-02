export function replaceNamedFunction(source, name, replacement) {
  const start = source.indexOf(`function ${name}(`);
  if (start < 0) throw new Error(`找不到需要更新的物理函式：${name}`);
  const next = source.indexOf('\nfunction ', start + 1);
  if (next < 0) throw new Error(`無法判斷物理函式結尾：${name}`);
  return `${source.slice(0, start)}${replacement}${source.slice(next)}`;
}
