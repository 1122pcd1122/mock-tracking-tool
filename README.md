# Mock & 埋点管理工具

本地 Web 工具，用于管理 Fiddler Mock 规则并一键映射到 FiddlerScript（CustomRules.js），附带埋点数据解析功能。

## 功能

- **Mock 管理**：多分类管理 Mock 数据，支持导入/编辑/删除，一键映射到 Fiddler
- **埋点解析**：粘贴 JSON 埋点日志，自动解析为结构化数据
- **JSON 展示**：树形查看 JSON 数据

## 快速开始

```bash
pip install -r requirements.txt   # 如果有额外依赖的话
python server.py
```

浏览器访问 `http://localhost:8765`

## 项目结构

```
mock-tracking-tool/
├── index.html                  # 入口页面
├── server.py                   # Python HTTP 服务端（端口 8765）
├── MOCK_RULES.md               # Mock 数据编写规则
├── css/
│   └── style.css               # 全局样式
├── js/
│   ├── app.js                  # Vue 应用入口
│   ├── utils/
│   │   ├── api.js              # 与 server.py 的 HTTP 通信
│   │   ├── mock-parser.js      # FiddlerScript 解析 & 生成
│   │   └── storage.js          # 埋点解析 & 正则匹配
│   └── components/
│       ├── mock-manager.js     # Mock 管理面板
│       ├── tracking-parser.js  # 埋点解析面板
│       ├── json-viewer-tab.js  # JSON 树形查看器
│       └── json-node.js        # JSON 节点组件
├── mocks/                      # Mock 数据存放目录（按分类）
├── vendor/
│   └── vue.global.prod.js      # Vue 3 生产构建
└── tracking_history/           # 埋点解析历史（本地数据，不入库）
```

## Mock 规则编写

Mock 文件为 `.txt` 格式，放入 `mocks/分类名/` 目录。内容为 FiddlerScript 的 if-block（含前导注释）。

**语法限制**：Fiddler 使用 JScript.NET（ES3），不支持 `===`、`let/const`、箭头函数等现代语法。

详见 [MOCK_RULES.md](MOCK_RULES.md)

## License

MIT
