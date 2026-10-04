# 可运行模板与资料替换

## 默认路径
新旅行优先运行 `python3 scripts/scaffold.py --output <新目录>`，得到完整可运行网页。不要从零重写布局或用 layout-example.html 代替成品。
模板来自原作者最终页面的布局与交互，旅行资料集中在 `trip-data.json`。更换资料，复用已有 CSS、地图、清单、攻略和记账代码；仅因用户明确改变功能或发现缺陷才修改组件。
运行 `python3 scripts/validate_trip.py <项目目录>/trip-data.json`；预览可用 `python3 -m http.server 8000 --directory <项目目录>`。项目内有 Node 时可 `npm run preview`、`npm run validate`、`npm test`，不需 npm install。

## 数据字段
schemaVersion=3。示例以 `assets/template/trip-data.json` 为准，禁止沿用旧 schemaVersion=1/2 的素材样例。
- `id`：独立旅行的稳定ID。新旅行必须换ID；既有旅行更新保持ID。scaffold未指定资料时生成新ID，指定 `--data` 时沿用该资料ID。
- `title/subtitle/startDate/endDate/timezone/coverImage`：标题、目的地、日期、IANA时区与封面。换目的地时替换通用 cover.svg 为本次地标封面，保留企鹅主屏幕图标；完成后将 demo=false。
- `importantEvents`：稳定ID、带偏移的at时间、title、description。只填重要事项，自动按时间选下一项；不是每条活动提醒。
- `overview`：cities（id/name/dayLabel）、legs（from/to/mode/status）。城市阶段从实际天数更新。
- `bookings`：flights的每个segments记录当地带偏移时间、各自IANA时区；hotels有rooms，取消政策简短且无价格；pending独立标待购/待预约。
- `places`：稳定ID、name、准确query、[lat,lon]或null、intro、approximate。区域点用approximate=true；不捏造坐标，null时保留名称导航。
- `days`：稳定ID、date/city/label/title/stay/timezone/color、routePlaceIds及events。路线保留重复酒店ID表达往返；长路线自动分段生成导航链接，避免手机浏览器途经点限制导致漏点；每活动有id、start/end（HH:MM）、title、placeId、note、status、guides，以及可选browse路线链接/备选文字。跨日节点明确说明日期，跨时区活动给timezone。
- `packing`：每组id/category/text。`shopping`：初始商品id/name及可选photo；默认空。
- `todos`：由AI从资料生成稳定ID、timingLabel、title、description、可选带偏移deadline与calendarLeadHours、相关event/booking ID。不增加网页编辑入口。
- `ledger`：初始settings、travelers与bills。真实模板默认空账单、不预选本人。人员稳定ID用于关联；汇率不编造，未知保持空并由设置补充。金额字段名称保留Cents兼容代码，但实际为各币种最小单位，算法见ledger.md。

## 新旅行与已有数据
`trip-data.json` 是旅行计划与初始资料，不是浏览器记账数据库。已保存的购物、勾选、攻略及账单不会因AI替换资料被清空。初始人员/币种只在第一次建立账本时读取；已有旅程增改人员在记账设置操作，或经明确授权实施数据迁移，不能声称改JSON会覆盖已存账本。
新增seed攻略可补入；已被用户修改/移除的同ID攻略保留用户版本。改其他活动字段保持ID，不丢攻略关联。
同域同trip ID共用本地数据；独立旅程用不同ID。默认浏览器本地保存，刷新保留，但清浏览器数据或换设备不共享。多标签页写入带版本检测，有Web Locks时加锁；冲突提示刷新，不能静默覆盖他页。
不提供清空数据、账单导入导出或前端PIN伪安全入口。若要云端/访问保护，遵循privacy-and-publishing.md，用使用者自己的服务替换 storage.js 接口并验证，不连原作者服务。

## 交付
替换资料后运行数据验证及记账测试，再按qa.md操作手机预览。检查实际地点、交通预算、封面、订票状态与未确认项。先交可用预览，公开部署仍需用户授权。网站默认静态可访问，服务器保护未配置前不要放私人订单和财务。
