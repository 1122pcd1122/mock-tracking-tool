// AI-Generated Begin 1780598201
// MockParser - 解析需求文档中的FiddlerScript文件 & 生成完整FiddlerScript
const MockParser = {

  // 字符串感知的括号计数 — 从指定位置开始找 if-block 闭合括号
  // 返回闭合 } 的位置（索引），未找到返回 -1
  _findBlockEnd(text, start) {
    let depth = 0, inBlock = false;
    let inSQ = false, inDQ = false; // 单/双引号字符串内
    for (let i = start; i < text.length; i++) {
      const ch = text[i];
      const prev = i > 0 ? text[i - 1] : '';

      if (inSQ) {
        if (ch === '\'' && prev !== '\\') inSQ = false;
        else if (ch === '\\' && prev === '\\') { /* escaped backslash, stay in SQ */ }
        continue;
      }
      if (inDQ) {
        if (ch === '"' && prev !== '\\') inDQ = false;
        else if (ch === '\\' && prev === '\\') { /* escaped backslash, stay in DQ */ }
        continue;
      }
      if (ch === '\'' && prev !== '\\') { inSQ = true; continue; }
      if (ch === '"' && prev !== '\\') { inDQ = true; continue; }
      // 注释 // 跳过该行剩余
      if (ch === '/' && text[i + 1] === '/') {
        const nl = text.indexOf('\n', i);
        i = nl !== -1 ? nl : text.length;
        continue;
      }

      if (ch === '{') { depth++; inBlock = true; }
      else if (ch === '}') {
        depth--;
        if (inBlock && depth === 0) return i;
      }
    }
    return -1;
  },

  // 从文件内容解析Mock
  parse(text) {
    const mocks = [];
    const re = /if\s*\(\s*oSession\.uriContains\(["']([^"']+)["']\)/g;
    let m;
    while ((m = re.exec(text)) !== null) {
      const url = m[1];
      const start = m.index;
      // 字符串感知的括号计数找到 if-block 结束
      const closeIdx = this._findBlockEnd(text, start);
      const end = closeIdx !== -1 ? closeIdx + 1 : text.length;

      // 提取顶部的注释作为名称和描述
      const beforeBlock = text.substring(0, start);
      const commentLines = beforeBlock.split('\n').filter(l => l.trim().startsWith('//') && !l.includes('==='));
      // 第一行注释 = 名称
      const firstComment = commentLines[0]?.replace(/^\/\/\s*/, '').trim() || '';
      // API注释
      const apiComment = commentLines.find(l => l.includes('API:'));
      const apiPath = apiComment ? apiComment.replace(/^\/\/\s*API:\s*\w+\s*/, '').trim() : url;

      // 提取替换规则
      const rules = [];
      const ruleRe = /new\s+System\.Text\.RegularExpressions\.Regex\(\s*'([^']+)'[\s\S]*?Replace\(\w+,\s*'([^']+)'\)/g;
      let rm;
      while ((rm = ruleRe.exec(text.substring(start, end))) !== null) {
        rules.push({ pattern: rm[1], replacement: rm[2] });
      }

      // 提取method
      const methodMatch = text.substring(start, end).match(/HTTPMethodIs\(["'](\w+)["']\)/);

      // 提取完整的原始脚本：从注释块开头到 if-block 结束
      // 向前找到注释块的第一行（连续的 // 注释）
      let rawStart = start;
      const beforeChars = text.substring(0, start);
      const beforeLines = beforeChars.split('\n');
      // 逐行计算在原文本中的精确位置（避免 indexOf 匹配到重复内容）
      let linePos = 0;
      const lineStarts = [];
      for (const line of beforeLines) {
        lineStarts.push(linePos);
        linePos += line.length + 1; // +1 for \n separator
      }
      for (let j = beforeLines.length - 1; j >= 0; j--) {
        const trimmed = beforeLines[j].trim();
        if (trimmed.startsWith('//') && !trimmed.includes('===')) {
          rawStart = lineStarts[j];
        } else {
          break;
        }
      }
      // rawStart 无效时回退到 start 之前的一个安全距离
      if (rawStart > start) rawStart = start > 200 ? start - 200 : 0;

      mocks.push({
        id: Date.now() + Math.random(),
        name: firstComment || url,
        urlPattern: url,
        apiPath,
        method: methodMatch ? methodMatch[1].toUpperCase() : 'ANY',
        rules: rules.length > 0 ? rules : [{ pattern: '', replacement: '' }],
        rawScript: text.substring(rawStart, end).trim(),
        enabled: true
      });
    }
    return mocks;
  },

  // 生成单个 Mock 的 FiddlerScript
  // 注意：rawScript 是 parse() 提取的单个 if-block（含前导注释），比 content 更精准
  generateOne(mock) {
    // 清理名称，移除换行符、控制字符和敏感字符
    const safeName = (mock.name || '')
      .replace(/[\x00-\x1f\x7f]/g, '')
      .replace(/[\\"']/g, "'")
      .replace(/\/\*/g, '')
      .replace(/\*\//g, '')
      .trim() || 'Mock';
    
    let script;

    // 优先使用 rawScript（parse 提取的单个 if-block）
    if (mock.rawScript) {
      script = this._normalizeScript(mock.rawScript);
    }
    // 其次使用 content（完整文件内容，仅当 rawScript 为空时作为 fallback）
    else if (mock.content && mock.content.trim()) {
      script = this._normalizeScript(mock.content);
    }
    // 否则从配置生成
    else {
      // 否则从配置生成
      const L = [];
      L.push(`    // ${safeName}`);
      if (mock.apiPath && mock.apiPath !== mock.urlPattern) L.push(`    // API: ${mock.method} ${mock.apiPath}`);
      
      // 构建 if 条件行 — && 必须在行末，不能在行首（JScript.NET 兼容）
      let condLine = `    if (oSession.uriContains("${mock.urlPattern}")`;
      if (mock.method !== 'ANY') condLine += ` && oSession.HTTPMethodIs("${mock.method}")`;
      condLine += ` && oSession.responseCode == 200)`;
      L.push(condLine);
      
      L.push(`    {`);
      L.push(`        var respBody = oSession.GetResponseBodyAsString();`);
      L.push(`        if (String.IsNullOrEmpty(respBody)) return;`);
      L.push(``);
      L.push(`        try {`);
      L.push(`            var newBody = respBody;`);

      const activeRules = (mock.rules || []).filter(r => r.pattern && r.replacement);
      if (activeRules.length > 0) {
        activeRules.forEach((r, i) => {
          L.push(`            // 规则${i + 1}`);
          L.push(`            newBody = new System.Text.RegularExpressions.Regex(`);
          L.push(`                '${r.pattern}',`);
          L.push(`                System.Text.RegularExpressions.RegexOptions.None`);
          L.push(`            ).Replace(newBody, '${r.replacement}');`);
          L.push(``);
        });
      } else {
        L.push(`            // TODO: 添加修改逻辑`);
        L.push(``);
      }

      L.push(`            oSession.utilSetResponseBody(newBody);`);
      L.push(`            FiddlerObject.log("[${safeName}] Mock");`);
      L.push(`        } catch (e) {`);
      L.push(`            FiddlerObject.log("[${safeName}] Error: " + e.Message);`);
      L.push(`        }`);
      L.push(`    }`);
      script = L.join('\n');
    }

    return script;
  },

  // 规范化脚本：修复 JScript.NET 不兼容的语法
  //   - && / || 必须在行末（JScript.NET 不允许在行首续行）
  //   - === / !== 严格比较（JScript.NET 基于 ES3，不支持严格相等）
  _normalizeScript(text) {
    let script = text.trim();
    
    // 修复 1: 行首的 && / || 移到上一行末尾
    // 如: if (cond1)\n    && cond2)  →  if (cond1) &&\n        cond2)
    script = script.replace(/([\s\S]*?)(\n\s*)(&&|\|\|)\s*/g, function(match, before, nl, op) {
      return before + ' ' + op + nl;
    });
    
    // 修复 2: 严格相等/不等 → 宽松比较（JScript.NET 不认 === / !==）
    // 如: x.indexOf('abc') === -1  →  x.indexOf('abc') == -1
    script = script.replace(/!==/g, '!=');
    script = script.replace(/===/g, '==');
    
    return script;
  },

  // 生成完整FiddlerScript
  generateAll(mocks) {
    const enabled = mocks.filter(m => m.enabled);
    if (enabled.length === 0) return '// 暂无启用的Mock规则\n// 请在Mock管理中添加并启用Mock数据';
    const header = [
      '// ============================================================',
      '// Mock & 埋点工具 - 自动生成 FiddlerScript',
      '// 生成时间: ' + new Date().toLocaleString(),
      '// 启用规则数: ' + enabled.length,
      '// ============================================================',
      '//',
      '// 使用方法:',
      '//   1. 打开 Fiddler → Rules → Customize Rules (Ctrl+R)',
      '//   2. 找到 OnBeforeResponse 函数',
      '//   3. 将下方所有代码粘贴到 OnBeforeResponse 函数内末尾',
      '//   4. Ctrl+S 保存，Fiddler 自动重新加载',
      '//   5. 配置手机代理 → 开始抓包测试',
      '// ============================================================',
      ''
    ].join('\n');
    return header + enabled.map(m => this.generateOne(m)).join('\n\n');
  }
};
window.MockParser = MockParser;
// AI-Generated End 1780598201
