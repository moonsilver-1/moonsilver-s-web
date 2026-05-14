使用说明

1. 双击 `start_server.bat`
作用：启动本地动态服务，默认端口 `8000`。

2. 双击 `show_urls.bat`
作用：显示当前局域网可访问地址。

3. 双击 `stop_server.bat`
作用：停止已经启动的服务。

当前二维码可使用的 URL 格式：

`http://你的电脑IP:8000/api/food.json`

`http://你的电脑IP:8000/api/daily.json`

`http://你的电脑IP:8000/api/electronics.json`

返回效果：

- 扫描 `food.json`：会在“食品”母类中随机返回一个子类
- 扫描 `daily.json`：会在“日用品”母类中随机返回一个子类
- 扫描 `electronics.json`：会在“电子产品”母类中随机返回一个子类
- 返回格式示例：`{"items":"苹果"}`

如果电脑 IP 变了：

- 重新双击 `start_server.bat`
- 再双击 `show_urls.bat`
- 用新的 IP 更新二维码

如果要手动启动，也可以使用：

`D:\anaconda\python.exe server.py`
