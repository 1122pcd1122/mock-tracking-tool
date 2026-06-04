# Mock 数据生成规则

> 按此规则编写 `.txt` 文件放入 `mocks/分类名/` 目录，工具会解析并映射到 Fiddler CustomRules.js。

---

## 一、文件结构

```
mocks/
└── 你的分类名/
    └── 描述性文件名.txt
```

文件内容是 **一个** if-block（含前导注释），不需要写 `class Handlers` 或 `OnBeforeResponse`，工具自动包裹。

---

## 二、JScript.NET 语法限制（必须遵守）

| 禁止 | 正确写法 |
|------|---------|
| `===` 严格相等 | `==` |
| `!==` 严格不等 | `!=` |
| `let` / `const` | `var` |
| 箭头函数 `() => {}` | `function(){}` |
| 模板字符串 `` `hello ${x}` `` | `'hello ' + x` |
| `&&` / `||` 在行首 | 放在上一行末尾 |
| `for...of` / `for...in` | 普通 `for` 循环 |

---

## 三、标准模板

```js
// Mock 简短描述（作为列表中的显示名称）
// API: GET /api/xxx/yyy
//
// 可追加多条注释说明

if (oSession.uriContains("/api/xxx/yyy") &&
    oSession.HTTPMethodIs("GET") &&
    oSession.responseCode == 200)
{
    var respBody = oSession.GetResponseBodyAsString();
    if (String.IsNullOrEmpty(respBody)) return;

    try {
        var newBody = respBody;

        // === 在这里写修改逻辑 ===

        oSession.utilSetResponseBody(newBody);
        FiddlerObject.log("[描述] Mock 已生效");
    } catch (e) {
        FiddlerObject.log("[描述] 错误: " + e.Message);
    }
}
```

## 四、条件组合

### 4.1 仅匹配 URL（不限制方法和状态码）

```js
if (oSession.uriContains("/api/some/path"))
```

### 4.2 URL + 方法

```js
if (oSession.uriContains("/api/some/path") &&
    oSession.HTTPMethodIs("POST"))
```

### 4.3 URL + 方法 + 响应码

```js
if (oSession.uriContains("/api/some/path") &&
    oSession.HTTPMethodIs("GET") &&
    oSession.responseCode == 200)
```

### 4.4 匹配域名

```js
if (oSession.HostnameIs("api.example.com") &&
    oSession.uriContains("/path"))
```

---

## 五、常用操作

### 5.1 Regex 替换 JSON 字段值

```js
var pattern = new System.Text.RegularExpressions.Regex(
    '"fieldName"\\s*:\\s*"[^"]*"',
    System.Text.RegularExpressions.RegexOptions.None
);
newBody = pattern.Replace(newBody, '"fieldName":"mockValue"');
```

### 5.2 Regex 在 JSON 中插入新字段

```js
var pattern = new System.Text.RegularExpressions.Regex(
    '("targetField"\\s*:\\s*\\{)',
    System.Text.RegularExpressions.RegexOptions.None
);
newBody = pattern.Replace(newBody, '$1"newField":"value",');
```

### 5.3 条件判断 + 修改

```js
if (newBody.indexOf('"someKey"') == -1) {
    // 只在字段不存在时才注入
    var pattern = new System.Text.RegularExpressions.Regex(
        '("data"\\s*:\\s*\\{)',
        System.Text.RegularExpressions.RegexOptions.None
    );
    newBody = pattern.Replace(newBody, '$1"mockData":{...},');
}
```

### 5.4 完整替换响应体

```js
// 用本地文件内容替换整个响应
oSession.utilSetResponseBody('{"code":200,"data":{}}');
```

### 5.5 修改请求 URL（需放在 OnBeforeRequest）

```js
// 注意：URL 替换必须放在 OnBeforeRequest 中，不能放在 OnBeforeResponse
if (oSession.uriContains("/api/production/")) {
    oSession.url = oSession.url.Replace("/api/production/", "/api/staging/");
}
```

---

## 六、Regex 转义速查

FiddlerScript 中字符串用单引号包裹，双引号不用转义。但 JSON 中的特殊字符需要：

| 字符 | Regex 中写法 | 说明 |
|------|-------------|------|
| `{` | `\\{` | 左花括号 |
| `}` | `\\}` | 右花括号 |
| `"` | `"` | 双引号（单引号字符串内不用转义） |
| `\` | `\\\\` | 反斜杠本身 |
| 空格 | `\\s` | 匹配空白 |
| 任意内容 | `[^"]*` | 匹配到下一个引号 |
| 分组引用 | `$1`, `$2` | 引用捕获组 |

---

## 七、完整示例

### 示例 1：修改商详接口的 giftTab.tips

```js
// 商详买赠提示语 Mock
// API: GET /shopping/app/detail/main/v6

if (oSession.uriContains("/shopping/app/detail/main/v6") &&
    oSession.responseCode == 200)
{
    var respBody = oSession.GetResponseBodyAsString();
    if (String.IsNullOrEmpty(respBody)) return;

    try {
        var pattern = new System.Text.RegularExpressions.Regex(
            '("giftTab"\\s*:\\s*\\{)',
            System.Text.RegularExpressions.RegexOptions.None
        );
        var replacement = '$1"tips":"数量有限，赠完即止",';
        var newBody = pattern.Replace(respBody, replacement);

        oSession.utilSetResponseBody(newBody);
        FiddlerObject.log("[giftTab] Mock 已生效");
    } catch (e) {
        FiddlerObject.log("[giftTab] 错误: " + e.Message);
    }
}
```

### 示例 2：注入浮层数据

```js
// Mock 派券浮层 - uiStyle=100
// API: POST /vips-mobile/rest/layout/productList/eventData/v1

if (oSession.uriContains("/layout/productList/eventData/v1") &&
    oSession.responseCode == 200)
{
    var respBody = oSession.GetResponseBodyAsString();
    if (String.IsNullOrEmpty(respBody)) return;

    try {
        var newBody = respBody;

        if (newBody.indexOf('"floaterData"') == -1) {
            var pattern = new System.Text.RegularExpressions.Regex(
                '("data"\\s*:\\s*\\{)',
                System.Text.RegularExpressions.RegexOptions.None
            );
            newBody = pattern.Replace(newBody, '$1"floaterData":{"key":"value"},');
        }

        if (newBody.indexOf('"type":8') == -1) {
            var typePattern = new System.Text.RegularExpressions.Regex(
                '("type"\\s*:\\s*)"[^"]*"',
                System.Text.RegularExpressions.RegexOptions.None
            );
            newBody = typePattern.Replace(newBody, '$1"8"');
        }

        oSession.utilSetResponseBody(newBody);
        FiddlerObject.log("[Float Mock] 已生效");
    } catch (e) {
        FiddlerObject.log("[Float Mock] 错误: " + e.Message);
    }
}
```

---

## 八、调试技巧

1. **检查是否命中**：Fiddler 左下角 Log 标签页会显示 `FiddlerObject.log()` 的输出
2. **检查响应内容**：Fiddler 中选中请求 → Inspectors → TextView/JSON 查看修改后的响应体
3. **语法检查**：修改 CustomRules.js 后 Ctrl+S 保存，Fiddler 底部状态栏显示编译结果
4. **重置脚本**：如果 CustomRules.js 损坏，删除后重启 Fiddler 会自动从 SampleRules.js 重建
