# startup-precheck
 
 在你真正运行项目之前，先帮你发现本地环境问题。
 
 `startup-precheck` 是一个本地 CLI 工具，专门用来做 **项目启动前体检**。它适合在这些场景里使用：
 
 - 新成员刚 `clone` 项目，不知道先检查什么
 - 老项目突然跑不起来，不想盲查环境
 - 你经常在多个技术栈项目之间切换
 - 你想把“启动前检查”变成一个可重复执行的流程
 
 ## 它解决什么问题
 
 在执行下面这些命令之前：
 
 ```bash
 npm run dev
 python main.py
 mvn spring-boot:run
 ```
 
 先检查这些常见坑：
 
 - 项目类型和框架是否识别正确
 - 关键文件是否缺失
 - Node、npm、Python、Java、Git、Docker 是否已安装
 - `.env` 是否存在
 - `.env.example` 里的变量是否补全
 - 常见开发端口是否被占用
 - Redis、MySQL、PostgreSQL、Docker 等依赖线索是否存在
 
 ## 功能亮点
 
 - **多技术栈支持**：Node.js / Python / Java / 通用项目
 - **框架识别**：Next.js、React、Vue、NestJS、FastAPI、Django、Spring Boot
 - **运行时检查**：Node / npm / pnpm / yarn / Python / pip / Java / Git / Docker
 - **配置检查**：`.env`、`.env.example`、关键文件存在性
 - **端口检查**：支持手动传入端口，也支持从项目内容里提取端口线索
 - **依赖服务线索**：自动识别 Redis / MySQL / PostgreSQL / Docker 配置痕迹
 - **双输出模式**：终端可读报告 + JSON 结构化报告
 
 ## 快速开始
 
 ### 本地开发运行
 
 ```bash
 npm install
 npm run build
 node .\dist\cli\index.js scan .
 ```
 
 ### 全局安装为 `precheck` 命令
 
 在项目目录里执行：
 
 ```bash
 npm install
 npm run link:global
 ```
 
 安装后你就可以直接在任意目录运行：
 
 ```bash
 precheck scan .
 precheck scan . --ports 3000,5173,8000
 precheck scan . --json
 precheck doctor .
 ```
 
 如果你之后不想保留全局链接，可以执行：
 
 ```bash
 npm unlink -g startup-precheck
 ```
 
 ## 使用示例
 
 ### 扫描当前目录
 
 ```bash
 precheck scan .
 ```
 
 ### 指定端口
 
 ```bash
 precheck scan . --ports 3000,5173,8000
 ```
 
 ### 输出 JSON
 
 ```bash
 precheck scan . --json
 ```
 
 ### 保存 JSON 报告
 
 ```bash
 precheck scan . --json --output report.json
 ```
 
 ### `doctor` 命令
 
 ```bash
 precheck doctor .
 ```
 
 当前 `doctor` 是 `scan` 的别名，适合做“快速健康检查”入口。
 
 ## 示例项目
 
 项目内置了两个本地示例，方便你直接演示：
 
 - `examples/node-missing-env`
 - `examples/python-service`
 
 ### 示例 1：缺少 `.env` 的 Node 项目
 
 ```bash
 precheck scan .\examples\node-missing-env
 ```
 
 你会看到类似输出：
 
 - 检测为 Node 项目
 - 识别到 `.env.example` 存在
 - 报告 `.env` 缺失
 - 提示 Redis 相关依赖线索

 ```text
 startup-precheck
 项目: node-missing-env-example
 路径: .\examples\node-missing-env
 类型: node
 框架: unknown
 包管理器: npm

 检查结果
 - [PASS] 项目类型识别: 识别为 node 项目
 - [PASS] 关键文件检查: README.md: README.md 已存在
 - [PASS] 关键文件检查: .env.example: .env.example 已存在
 - [PASS] 关键文件检查: package.json: package.json 已存在
 - [PASS] 运行时检查: git: git 已安装
 - [PASS] 运行时检查: node: node 已安装
 - [PASS] 运行时检查: npm: npm 已安装
 - [FAIL] .env 文件检查: 检测到 .env.example，但 .env 缺失
   建议: 请根据 .env.example 创建 .env 文件
 - [PASS] 端口检查: 3000: 端口 3000 可用
 - [WARN] 服务线索检查: redis: 检测到 redis 相关配置线索，请确认对应服务已启动并配置正确

 汇总
 PASS: 9
 WARN: 1
 FAIL: 1
 SKIP: 0
 ```
 
 ### 示例 2：带服务线索的 Python 项目
 
 ```bash
 precheck scan .\examples\python-service --ports 8000
 ```
 
 你会看到类似输出：
 
 - 检测为 Python 项目
 - 识别为 FastAPI
 - 识别 PostgreSQL / Redis 线索
 - 检查端口是否可用

 ```text
 startup-precheck
 项目: python-service
 路径: .\examples\python-service
 类型: python
 框架: fastapi
 包管理器: pip

 检查结果
 - [PASS] 项目类型识别: 识别为 python 项目
 - [PASS] 关键文件检查: README.md: README.md 已存在
 - [PASS] 关键文件检查: .env.example: .env.example 已存在
 - [PASS] 关键文件检查: requirements.txt: requirements.txt 已存在
 - [PASS] 运行时检查: git: git 已安装
 - [PASS] 运行时检查: python: python 已安装
 - [PASS] 运行时检查: pip: pip 已安装
 - [FAIL] .env 文件检查: 检测到 .env.example，但 .env 缺失
   建议: 请根据 .env.example 创建 .env 文件
 - [PASS] 端口检查: 8000: 端口 8000 可用
 - [WARN] 服务线索检查: redis: 检测到 redis 相关配置线索，请确认对应服务已启动并配置正确
 - [WARN] 服务线索检查: postgresql: 检测到 postgresql 相关配置线索，请确认对应服务已启动并配置正确

 汇总
 PASS: 8
 WARN: 2
 FAIL: 1
 SKIP: 0
 ```

 ## 输出状态说明
 
 - `pass`：检查通过
 - `warn`：发现风险或缺失，但不一定阻止启动
 - `fail`：高概率影响启动，建议先处理
 - `skip`：当前项目或环境不适用该检查项
 
 终端报告会包含：
 
 - 项目识别结果
 - 每项检查结论
 - 可操作建议
 - 汇总统计
 
 ## 支持检查的关键文件
 
 - `package.json`
 - `requirements.txt`
 - `pyproject.toml`
 - `pom.xml`
 - `build.gradle`
 - `.env`
 - `.env.example`
 - `docker-compose.yml`
 - `README.md`
 
 ## 测试
 
 ```bash
 npm run build
 npm test
 ```
 
 开发态测试：
 
 ```bash
 npm run test:dev
 ```
 
 ## 当前限制
 
 - 第一版基于常见文件和配置做启发式识别，不覆盖所有框架和构建系统
 - 服务检查当前主要基于配置线索和本机运行时可用性判断，不直接连接真实数据库
 - 对复杂 Monorepo 的支持还未加入
 
 ## Roadmap
 
 - Monorepo 支持
 - HTML 报告导出
 - 更细粒度规则系统
 - CI 集成
 - GUI 版本
 - 团队自定义规则
 
 ## 本地开发命令
 
 ```bash
 npm install
 npm run build
 npm test
 npm run link:global
 ```
 
 ## License
 
 MIT
