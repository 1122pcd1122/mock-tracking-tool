// AI-Generated Begin 1780588259
// TrackingUtil - 自动识别并解析两种埋点格式
const TrackingUtil = {
  // 自动判断格式并解析
  parse(input) {
    const t = input.trim();
    if (!t) return [];
    // 含有 = 和 & → URL query string格式
    if (t.includes('=') && t.includes('&')) {
      return this.parseQueryString(t);
    }
    // 大量 _ 且无 = → 下划线分隔格式
    if (t.includes('_') && !t.includes('=')) {
      return this.parseUnderscore(t);
    }
    // 兜底：尝试下划线格式
    if (t.includes('_')) return this.parseUnderscore(t);
    return [];
  },

  // -------- URL query string格式 --------
  parseQueryString(input) {
    const results = [];
    const lines = input.split('\n').filter(l => l.trim());
    for (const line of lines) {
      const data = {};
      const pairs = line.trim().split('&');
      for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = decodeURIComponent(pair.substring(0, idx));
        data[key] = this.decodeVal(pair.substring(idx + 1));
      }
      const eventName = data.activity || data.event || data.event_name || data.action || '';
      const params = {};
      for (const k of Object.keys(data)) {
        if (!['activity','event','event_name','action','timestamp','time','ts'].includes(k)) {
          params[k] = data[k];
        }
      }
      results.push({
        id: Date.now() + Math.random(), raw: line, eventName, params, allData: data,
        parsedAt: new Date().toLocaleString(), format: 'query'
      });
    }
    return results;
  },

  // -------- 下划线分隔格式 (_ , |) --------
  parseUnderscore(input) {
    // 按记录分隔（逗号后跟数字=下一条记录的开始）
    const rawRecords = input.split(/,(?=\d+_)/);
    const results = [];

    for (const rec of rawRecords) {
      const clean = rec.trim().replace(/,$/, '');
      if (!clean) continue;
      // 主分隔符 _
      const fields = clean.split('_');
      if (fields.length < 5) {
        console.warn('[TrackingUtil] 跳过字段数不足的记录:', clean.substring(0, 80));
        continue;
      }

      // 生成字段名
      const data = {};
      fields.forEach((val, i) => {
        const key = this.inferFieldName(i, val, fields);
        // 处理 | 子值
        if (val.includes('|')) {
          data[key] = val.split('|').map(v => v === '-99' || v === '' ? null : v);
        } else {
          data[key] = this.smartVal(val);
        }
      });

      // 事件名 = 业务ID + 商品名
      const eventName = this.buildEventName(data);
      const params = {};
      Object.keys(data).forEach(k => {
        if (k !== 'eventName') params[k] = data[k];
      });

      results.push({
        id: Date.now() + Math.random(), raw: rec, eventName, params, allData: data,
        parsedAt: new Date().toLocaleString(), format: 'underscore',
        fieldCount: fields.length,
        fields: fields.map((v, i) => ({ index: i, key: this.inferFieldName(i, v, fields), value: v }))
      });
    }
    return results;
  },

  // 智能推断字段名
  inferFieldName(idx, val, allFields) {
    const isLast = idx === allFields.length - 1;
    // 最后一个字段：商品名（含中文）
    if (isLast) return '商品名称';

    // 时间戳 (13位毫秒级)
    if (/^\d{13}$/.test(val)) return this.guessTimestampName(allFields, idx);

    // 长数字ID (16-20位)
    if (/^\d{16,20}$/.test(val)) return '商品SPU';

    // 短数字ID (9-12位)
    if (/^\d{9,12}$/.test(val) && idx < 2) return '业务ID';

    // MD5 (32位hex)
    if (/^[a-f0-9]{32}$/i.test(val)) return 'MD5';

    // 带 # @ 的特殊标识
    if (val.includes('#') || val.includes('@')) return '来源渠道';

    // 含 | 子分隔符
    if (val.includes('|')) return `属性组${idx}`;

    // "dft" 开头的
    if (/^dft/i.test(val)) return '实验标识';

    // 负ID (如 -1513587638999152336)
    if (/^-\d{10,}$/.test(val)) return '关联ID';

    return `字段${idx}`;
  },

  guessTimestampName(fields, idx) {
    // 找最近的另一个时间戳
    const timestamps = [];
    fields.forEach((v, i) => {
      if (/^\d{13}$/.test(v)) timestamps.push(i);
    });
    const pos = timestamps.indexOf(idx);
    if (timestamps.length >= 2) {
      if (pos === 0) return '开始时间';
      if (pos === 1) return '结束时间';
      return `时间${pos + 1}`;
    }
    return '时间戳';
  },

  buildEventName(data) {
    const bizId = data['业务ID'] || '';
    const spu = data['商品SPU'] || '';
    const name = data['商品名称'] || '';
    if (name) return `商品曝光: ${name}`;
    if (spu) return `SPU: ${spu}`;
    return bizId || '埋点事件';
  },

  smartVal(val) {
    const v = val.trim();
    if (v === '-99' || v === '' || v === 'null') return null;
    if (/^-?\d+$/.test(v) && v.length < 16) return Number(v);
    return v;
  },

  decodeVal(val) {
    if (val === 'null' || val === 'undefined') return null;
    try { return JSON.parse(decodeURIComponent(val)); } catch (e) {
      return decodeURIComponent(val);
    }
  },

  eventNames(records) {
    return [...new Set(records.map(r => r.eventName).filter(Boolean))];
  }
};
window.TrackingUtil = TrackingUtil;
// AI-Generated End 1780588259
