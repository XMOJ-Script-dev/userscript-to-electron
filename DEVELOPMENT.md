# 开发指南

## 项目结构

```
tamperjs/
├── src/
│   ├── index.ts              # 主导出文件
│   ├── converter.ts          # 主转换器类
│   ├── metadata.ts           # 元数据解析器
│   ├── gm-polyfill.ts        # GM API polyfill 生成器
│   └── test.ts               # 基础测试
├── examples/
│   ├── page-counter.user.js      # 示例1: 简单脚本
│   ├── usage.ts                  # 使用示例
│   └── electron-integration.ts   # Electron集成示例
├── dist/                     # 编译输出（构建后）
├── package.json
├── tsconfig.json
├── README.md
└── LICENSE
```

## 开发设置

### 安装依赖

```bash
npm install
```

### 构建

```bash
npm run build
```

### 开发模式（监视模式）

```bash
npm run dev
```

这会启用 TypeScript 编译器的 watch 模式。

### 运行测试

```bash
npm test
```

## 核心模块说明

### 1. `metadata.ts` - 元数据解析

负责：
- 解析 userscript 元数据块（@name, @match 等）
- 验证必需字段
- 返回结构化的 `UserscriptMetadata` 对象

关键方法：
- `parse(scriptContent: string): UserscriptMetadata` - 从脚本内容解析元数据
- `extractMetadataBlock(content: string): string` - 提取元数据区块

### 2. `gm-polyfill.ts` - API Polyfill

负责：
- 为各种 GM API 生成 JavaScript polyfill 代码
- 处理数据持久化（使用 JSON 文件）
- 集成 node-fetch 用于 HTTP 请求
- 集成 Electron Notification 和 shell APIs

支持的 API：
- `GM_getValue/setValue/deleteValue/listValues` - 本地存储
- `GM_xmlhttpRequest` - 网络请求
- `GM_download` - 文件下载
- `GM_notification` - 桌面通知
- `GM_openInTab` - 打开链接
- `unsafeWindow` - 全局作用域

### 3. `converter.ts` - 主转换器

负责：
- 整合其他模块
- 转换完整脚本
- 生成最终代码
- 支持多种输出格式

关键方法：
- `convert(scriptContent: string): ConvertResult`
- `convertFile(filePath: string): ConvertResult`
- `save(result: ConvertResult, outputPath: string): void`

### 4. `index.ts` - 公共 API

导出所有公共的类和接口。

## 扩展功能

### 添加新的 GM API 支持

1. 在 `gm-polyfill.ts` 中找到 `generatePolyfill()` 方法
2. 添加新的 case：

```typescript
case 'GM_newAPI':
  polyfills.push(this.generateGM_newAPI());
  break;
```

3. 实现生成函数：

```typescript
private generateGM_newAPI(): string {
  return `
function GM_newAPI(arg) {
  // Implementation
}
`;
}
```

### 添加新的输出格式

1. 在 `converter.ts` 中的 `generateCommonJSCode()` 旁边添加新方法
2. 在 `convert()` 方法中检查 `format` 选项

## 测试

项目包含基础的功能测试。要添加更多测试：

1. 编辑 `src/test.ts`
2. 添加测试用例
3. 运行 `npm test`

## 发布到 npm

### 准备发布

1. 更新 `package.json` 中的版本号
2. 确保所有测试通过
3. 更新 README 和文档
4. 构建项目：`npm run build`

### 发布

```bash
# 首次登录
npm login

# 发布
npm publish

# 发布到特定标签
npm publish --tag beta
```

## 常见任务

### 调试脚本转换

```typescript
const converter = new UserscriptConverter();
const result = converter.convert(scriptContent);

console.log('Metadata:', result.metadata);
console.log('Generated code:', result.code);
```

### 测试特定 API

```typescript
const polyfill = new GMPolyfill({ dataDir: '/tmp/test' });
const code = polyfill.generatePolyfill(['GM_getValue', 'GM_xmlhttpRequest']);
console.log(code);
```

## 性能考虑

- **缓存元数据解析结果** - 如果频繁转换同一脚本
- **流式处理大文件** - 对于超大脚本，考虑流式处理
- **限制 polyfill 生成** - 只生成所需 API 的 polyfill

## 安全注意事项

⚠️ **重要提示**

1. 未验证的脚本可能包含恶意代码
2. 建议在沙箱环境中执行
3. 限制文件系统访问权限
4. 以最小权限原则运行应用

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/NewFeature`)
3. 提交更改 (`git commit -m 'Add NewFeature'`)
4. 推送到分支 (`git push origin feature/NewFeature`)
5. 创建 Pull Request

## 许可证

MIT License - 详见 LICENSE 文件
