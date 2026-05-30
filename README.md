# MOONSILVER

个人站点主仓库，基于 Next.js 16 App Router + React 19 + Tailwind CSS 4。支持中英文双语、明暗主题切换。

## 主要页面

- `/` 个人主页（荣誉、竞赛成绩、科研经历）
- `/fun` 娱乐入口
- `/fun/2048` 2048 小游戏
- `/fun/tetris` 俄罗斯方块
- `/fun/birthday` 生日页
- `/fun/jobti` Jobti 职业向量速写
- `/blog` 博客
- `/contest` 竞赛区（智能车 JSON 小站等）
- `/account` 登录页

## 内容怎么改

- 博客文章放在 `content/blog/`，文件名即 slug，支持 `.md`、`.txt`、`.markdown`
- Jobti 数据放在 `app/fun/jobti/jobti-data.ts`
- 足球数据站逻辑和数据在 `app/fun/football/`

## 代码结构

- `app/` Next.js 页面和路由
- `app/components/` 导航栏、语言切换、登录等通用组件
- `app/lib/` 公共逻辑（主题、认证、博客/故事加载等）
- `app/fun/` 娱乐模块（游戏、足球、Jobti、故事）
- `content/` 本地内容目录
  - `content/blog/` 博客文章
- `data/` 账号数据
- `public/` 静态资源

## 开发命令

```bash
pnpm install
pnpm dev
pnpm build
pnpm lint
```

## 维护提示

- 全站样式入口是 `app/globals.css`，改样式优先看这里
- 博客是文件驱动，不依赖站内编辑器
