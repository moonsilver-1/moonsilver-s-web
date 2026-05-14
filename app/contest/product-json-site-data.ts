export type ProductEndpoint = "/contest/api/food.json" | "/contest/api/daily.json" | "/contest/api/electronics.json";

export const PRODUCT_ENDPOINTS: Array<{
  endpoint: ProductEndpoint;
  title: { zh: string; en: string };
  intro: { zh: string; en: string };
  items: string[];
}> = [
  {
    endpoint: "/contest/api/food.json",
    title: { zh: "食品", en: "Food" },
    intro: {
      zh: "每次访问会从水果、肉类、乳制品等子类中随机返回一个结果。",
      en: "Each request returns one random item from fruits, meats, dairy, and other subcategories.",
    },
    items: [
      "苹果",
      "香蕉",
      "橙子",
      "葡萄",
      "西瓜",
      "猪肉",
      "牛肉",
      "鸡肉",
      "鱼肉",
      "牛奶",
      "酸奶",
      "面包",
      "饼干",
      "鸡蛋",
      "大米",
      "面条",
      "玉米",
      "土豆",
      "西红柿",
      "白菜",
    ],
  },
  {
    endpoint: "/contest/api/daily.json",
    title: { zh: "日用品", en: "Daily Goods" },
    intro: {
      zh: "每次访问会从牙刷、牙膏、毛巾、洗衣液等子类中随机返回一个结果。",
      en: "Each request returns one random item from toothbrushes, toothpaste, towels, and more.",
    },
    items: [
      "牙刷",
      "牙膏",
      "毛巾",
      "脸盆",
      "洗衣液",
      "清洁剂",
      "香皂",
      "纸巾",
      "拖把",
      "垃圾袋",
      "洗发水",
      "沐浴露",
      "水杯",
      "保鲜膜",
      "抽纸",
      "衣架",
      "扫把",
      "抹布",
      "清洁海绵",
      "收纳盒",
    ],
  },
  {
    endpoint: "/contest/api/electronics.json",
    title: { zh: "电子产品", en: "Electronics" },
    intro: {
      zh: "每次访问会从手机、耳机、键盘、鼠标、路由器等子类中随机返回一个结果。",
      en: "Each request returns one random item from phones, headphones, keyboards, mice, routers, and more.",
    },
    items: [
      "手机",
      "耳机",
      "键盘",
      "鼠标",
      "显示器",
      "平板电脑",
      "充电器",
      "数据线",
      "路由器",
      "音箱",
      "智能手表",
      "笔记本电脑",
      "摄像头",
      "移动硬盘",
      "U盘",
      "打印机",
      "投影仪",
      "蓝牙音箱",
      "麦克风",
      "游戏手柄",
    ],
  },
] as const;

export function pickRandomItem(items: readonly string[]) {
  return items[Math.floor(Math.random() * items.length)];
}
