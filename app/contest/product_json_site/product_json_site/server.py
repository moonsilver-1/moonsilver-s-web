import json
import random
from http.server import HTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlparse


BASE_DIR = Path(__file__).resolve().parent
HOST = "0.0.0.0"
PORT = 8000

CATEGORY_DATA = {
    "/api/food.json": {
        "parent_category": "食品",
        "sub_categories": [
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
    "/api/daily.json": {
        "parent_category": "日用品",
        "sub_categories": [
            "牙刷",
            "牙膏",
            "毛巾",
            "脸盆",
            "洗衣液",
            "洗洁精",
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
    "/api/electronics.json": {
        "parent_category": "电子产品",
        "sub_categories": [
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
}


def build_payload(endpoint: str) -> dict:
    category = CATEGORY_DATA[endpoint]
    selected = random.choice(category["sub_categories"])
    return {"code": 200, "result": selected}


class ProductRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(BASE_DIR), **kwargs)

    def do_GET(self):
        path = urlparse(self.path).path

        if path in CATEGORY_DATA:
            payload = build_payload(path)
            body = json.dumps(payload, ensure_ascii=False, indent=2).encode("utf-8")

            self.send_response(200)
            self.send_header("Content-Type", "application/json; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return

        if path == "/":
            self.path = "/index.html"

        super().do_GET()


def main():
    server = HTTPServer((HOST, PORT), ProductRequestHandler)
    print(f"Serving on http://127.0.0.1:{PORT}")
    server.serve_forever()


if __name__ == "__main__":
    main()
