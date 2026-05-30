# 设计研究记录

## 研究目标
搜集2025-2026年高级网站设计趋势，为 MOONSILVER 美化提供参考。

## 设计趋势发现

### 1. 玻璃拟态与新拟态结合 (Glassmorphism + Neumorphism)
- 半透明背景 + backdrop-blur 仍是主流
- 但趋向更克制：更低的不透明度、更细的边框
- 浅色模式下使用白色/米白色半透明，而非灰色

### 2. 微交互与动效
- 滚动触发的渐进式动画（Scroll-triggered reveals）
- 文字字符逐个出现效果
- 卡片 hover 时的微妙 3D 倾斜
- 磁性按钮（Magnetic buttons）

### 3. 排版趋势
- 超大标题 + 精致小字形成强烈对比
- 使用-serif字体展示个性（已有 Cormorant Garamond，很好）
- 行高更宽松（1.6-1.8）
- 字间距微调

### 4. 颜色与质感
- 深色模式趋向"暖黑"而非纯黑（已有 #050505 不错）
- 浅色模式使用暖白色/奶油色（已有 #f5f1e8 很好）
- 强调色更饱和但使用面积更小
- 渐变边框和发光效果

### 5. 布局趋势
- 更大胆的留白
- 非对称网格
- 卡片圆角趋向一致（16px-24px）
- 粘性元素和视差滚动

### 6. 高级细节
- 自定义光标
- 页面切换的遮罩动画
- 噪声纹理叠加增加质感
- 渐变文字效果

## 2025-2026 Awwwards 获奖趋势

### 实验性导航
- CUSP by Adam Bricker — 打破常规导航，滚动触发动画

### 3D & 触感体验
- Mr. Pandas Paper Portfolio — 3D纸艺互动体验
- Immersive Garden — WebGL、3D动画、电影式数字旅程

### 非对称与层叠布局
- 重叠元素、不同文字大小、非对称构图
- 视差效果增加深度

### 视觉风格
| 风格 | 描述 |
|------|------|
| Neo Deco | 装饰艺术复兴，几何形状，优雅衬线，金属渐变 |
| After-Dark Aesthetic | 情绪化、戏剧性配色、丰富对比、戏剧排版 |
| 金属/未来感 | 简洁线条、金属渐变、克制配色 |
| 黑白 | 永恒、高对比、清晰 |
| 动态排版 | 移动、反应式文字作为主要视觉元素 |

### 技术趋势
- Scroll-Triggered Animations（滚动触发动画）
- Interactive Grids with Hover Effects（带悬停效果的交互网格）
- Infinite Scrolling（无限滚动）
- Video Backgrounds（视频背景，节制使用）
- Split-Screen Design（分屏设计）

## 应用到本项目
- 保持现有场景切换特色（核心卖点）
- 增强滚动动画（Intersection Observer）
- 统一卡片设计语言
- 优化 typography 层次
- 添加微妙的颗粒噪声纹理
- 增强微交互
- 改进页面过渡效果
- 导航栏滚动状态变化
- 卡片 3D hover 效果

## 来源
- [Best 15 Modern Portfolio Website Design Examples That Win Clients in 2026](https://wegic.ai/inspiration/best-modern-portfolio-website-design-examples)
- [60 Award Winning Websites of 2026](https://hireadrian.com/award-winning-websites/)
- [19 Best Portfolio Design Trends (In 2026) - Colorlib](https://colorlib.com/wp/portfolio-design-trends/)
- [2026 Design Trends - Yes I'm a Designer](https://yesimadesigner.com/2026-design-trends-that-actually-matters/)
- [Awwwards Nominees](https://www.awwwards.com/websites/2025/)
- [100 Best Designer Portfolio Websites of 2026](https://muz.li/blog/top-100-most-creative-and-unique-portfolio-websites-of-2025/)
