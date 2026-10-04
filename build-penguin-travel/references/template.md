# 可运行模板与资料替换

## 默认路径
新旅行优先运行 `python3 scripts/scaffold.py --output <新目录>`，得到完整可运行网页。不要从零重写布局或用 layout-example.html 代替成品。
模板来自原作者最终页面的布局与交互，旅行资料集中在 `trip-data.json`。更换资料，复用已有 CSS、地图、清单、攻略和记账代码；仅因用户明确改变功能、发现缺陷或按目的地适配导航服务才修改组件。模板默认Google导航；中国大陆或混合旅行由AI按product.md的地图服务选择规则实际适配链接生成与回退逻辑，不能只改资料宣称已支持高德。
运行 `python3 scripts/validate_trip.py <项目目录>/trip-data.json`；预览可用 `python3 -m http.server 8000 --directory <项目目录>`。项目内有 Node 时可 `npm run preview`、`npm run validate`、`npm test`，不需 npm install。

## 数据字段
schemaVersion=3。示例以 `assets/template/trip-data.json` 为准，禁止沿用旧 schemaVersion=1/2 的素材样例。
- `id`：独立旅行的稳定ID。新旅行必须换ID；既有旅行更新保持ID。scaffold未指定资料时生成新ID，指定 `--data` 时沿用该资料ID。
- `title/subtitle/startDate/endDate/timezone/coverImage`：标题、目的地、日期、IANA时区与封面。换目的地时按design.md的目的地封面指令自动生成地标或风景背景并更新coverImage；封面自由选色、不要求企鹅，保留网页UI配色与主屏幕图标；完成后将 demo=false。
- `importantEvents`：稳定ID、带偏移的at时间、title、description。只填重要事项，自动按时间选下一项；不是每条活动提醒。
- `overview`：mapImage（目的地手绘底图路径）、canvas（width/height）、mapNote，cities（id/name/dayLabel/position以及可选coordinates、labelOffset、labelAnchor）、legs（from/to/mode/status）。position为相对画布的[x,y]，范围0–1，必须和底图对齐；coordinates为已核实的[lat,lon]，不用于日常导航。底图不得含固定城市名称或路线，按overview-map.md生成。城市阶段从实际天数更新。
- `bookings`：pending每条渲染一张独立小卡，不能全部放在一张大卡中。flights的每个segments记录当地带偏移时间、各自IANA时区；hotels有rooms，取消政策简短且无价格；pending独立标待购/待预约。
- `places`：稳定ID、name、准确query、[lat,lon]或null、intro、approximate、kind（地点用途）、showIntro（可选关闭介绍）、navigationLabel（可选简短导航名称）。机场/普通车站/住宿/logistics不生成介绍；观光交通用experience。区域点用approximate=true；不捏造坐标，null时保留名称导航。
- `days`：稳定ID、date/city/label/title/stay/timezone/color、routePlaceIds（完整地图点位）、navigationPlaceIds（主要导航节点，可省略并兼容routePlaceIds）及events。路线保留重复酒店ID表达往返；逛街店铺不自动加入navigationPlaceIds、不生成街区步行路线按钮。仅平台上限需要时分段，保留全部主要节点；按钮显示“导航1 · 起点 → 终点”且保留平台限制的简短说明，不列途经点；每活动有id、start/end（HH:MM）、title、placeId、note、status、guides。默认不使用browse、夜市摊位路线或“有空再逛”专用字段/组件。跨日节点明确说明日期，跨时区活动给timezone。
- `packing`：每组id/category/text，同category汇成独立卡；按product.md的卡片网格规则自适应均衡列数，手机单列，初始分类固定、物品可用细线+新增及点击文字修改。`shopping`：初始商品id/name及可选photo；默认空。
- `todos`：由AI从资料生成稳定ID、timingLabel、title、description、可选带偏移deadline与calendarLeadHours、相关event/booking ID。不增加网页编辑入口。
- `ledger`：初始settings、travelers与bills。真实模板默认空账单、不预选本人。人员稳定ID用于关联；汇率不编造，未知保持空并由设置补充。金额字段名称保留Cents兼容代码，但实际为各币种最小单位，算法见ledger.md。

## 新旅行与已有数据
`trip-data.json` 是旅行计划与初始资料，不是浏览器记账数据库。已保存的购物、勾选、攻略及账单不会因AI替换资料被清空。初始人员/币种只在第一次建立账本时读取；已有旅程增改人员在记账设置操作，或经明确授权实施数据迁移，不能声称改JSON会覆盖已存账本。
新增seed攻略可补入；已被用户修改/移除的同ID攻略保留用户版本。改其他活动字段保持ID，不丢攻略关联。
同域同trip ID共用本地数据；独立旅程用不同ID。默认浏览器本地保存，刷新保留，但清浏览器数据或换设备不共享。多标签页写入带版本检测，有Web Locks时加锁；冲突提示刷新，不能静默覆盖他页。
不提供清空数据、账单导入导出或前端PIN伪安全入口。若要云端/访问保护，遵循privacy-and-publishing.md，用使用者自己的服务替换 storage.js 接口并验证，不连原作者服务。

## 交付
替换资料后运行数据验证及记账测试，再按qa.md操作手机预览。检查实际地点、交通预算、封面、订票状态与未确认项。未要求发布时先交可用预览；使用者明确要求发布且平台支持时直接发布并验证最终网址，不重复确认。无发布能力时交付完整项目并说明限制。网站默认静态可访问，服务器保护未配置前不要放私人订单和财务。

## 当日底图适配
基础模板随附Leaflet/OSM，示例不代表已接入高德。执行AI为国内旅行按product.md配置使用者自己的高德JS API与安全设置，并替换底图/标记/连线实现；各地图共享当日点位、顺序、全览、放大、点选交互。不要求模板作者提供密钥，不能用非官方瓦片地址绕过高德配置。没有配置时明确说明，提供路线示意及高德外部导航，不称为高德底图。

行李用户改动保存在页面状态的`packingItems`（稳定id/category/text/removed）中，勾选继续使用`packing[id]`布尔值。与trip.packing按ID合并，删除标记优先；保留旧版只有packing勾选数据的兼容，不在旅行资料替换时清空用户修改。新增项只能属于预设分类，删除最后一项后保留空分类及+入口。云同步扩展同时保存两个字段，不借用原作者配置。

总览底图使用目的地专属的细腻铅笔/水彩栅格插画；先查看 assets/overview-style-reference.webp，不能用简化SVG色块替代。画幅按地区确定，overview.canvas与图片长宽比一致，按overview-map.md核对地理与视觉质量。随附地图仅是虚构演示的画风样例，不可只换真实城市名字继续使用。
