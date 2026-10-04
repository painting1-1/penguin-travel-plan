/* Adapted from the author's final travel page; MIT. Original travel components: Travel Template contributors (2026), see THIRD_PARTY_NOTICES.md. */
(() => {
  "use strict";

  const STORAGE_VERSION = 1;
  const DEFAULT_SETTINGS = Object.freeze({
    baseCurrency: "CNY",
    commonCurrencies: ["THB"],
    lastCurrency: "THB",
    exchangeRates: {}
  });
  const CATEGORIES = Object.freeze(["餐饮", "交通", "住宿", "门票", "购物", "其他"]);
  const AVATAR_COLORS = Object.freeze([
    "#D96C42", "#217D91", "#5C8E62", "#8B6AA8", "#C58B32",
    "#4F72A2", "#B85F76", "#4E8F86", "#9A6B4F", "#68798E"
  ]);

  // The picker searches every field, so the complete catalog can stay out of view
  // until a traveler asks for a particular currency.
  const SEEDED_CURRENCY_CATALOG = Object.freeze([
    ["CNY", "人民币", "Chinese Yuan", "¥", "中国 大陆 人民币 rmb yuan renminbi"],
    ["HKD", "港币", "Hong Kong Dollar", "HK$", "香港 港元 hongkong"],
    ["MOP", "澳门元", "Macanese Pataca", "MOP$", "澳门 澳币 macau pataca"],
    ["TWD", "新台币", "New Taiwan Dollar", "NT$", "台湾 台币 taiwan"],
    ["EUR", "欧元", "Euro", "€", "欧盟 欧洲 eurozone europe"],
    ["CHF", "瑞士法郎", "Swiss Franc", "CHF", "瑞士 列支敦士登 switzerland liechtenstein"],
    ["USD", "美元", "US Dollar", "$", "美国 美金 united states america usa"],
    ["GBP", "英镑", "British Pound", "£", "英国 联合王国 britain uk sterling"],
    ["JPY", "日元", "Japanese Yen", "¥", "日本 japan yen"],
    ["KRW", "韩元", "South Korean Won", "₩", "韩国 korea won"],
    ["SGD", "新加坡元", "Singapore Dollar", "S$", "新加坡 singapore 新币"],
    ["MYR", "马来西亚林吉特", "Malaysian Ringgit", "RM", "马来西亚 malaysia 马币"],
    ["THB", "泰铢", "Thai Baht", "฿", "泰国 thailand baht"],
    ["IDR", "印度尼西亚盾", "Indonesian Rupiah", "Rp", "印度尼西亚 印尼 indonesia rupiah"],
    ["PHP", "菲律宾比索", "Philippine Peso", "₱", "菲律宾 philippines peso"],
    ["VND", "越南盾", "Vietnamese Dong", "₫", "越南 vietnam dong"],
    ["KHR", "柬埔寨瑞尔", "Cambodian Riel", "៛", "柬埔寨 cambodia riel"],
    ["LAK", "老挝基普", "Lao Kip", "₭", "老挝 laos kip"],
    ["MMK", "缅甸元", "Myanmar Kyat", "K", "缅甸 myanmar burma kyat"],
    ["BND", "文莱元", "Brunei Dollar", "B$", "文莱 brunei"],
    ["INR", "印度卢比", "Indian Rupee", "₹", "印度 india rupee"],
    ["PKR", "巴基斯坦卢比", "Pakistani Rupee", "₨", "巴基斯坦 pakistan rupee"],
    ["BDT", "孟加拉塔卡", "Bangladeshi Taka", "৳", "孟加拉国 bangladesh taka"],
    ["LKR", "斯里兰卡卢比", "Sri Lankan Rupee", "Rs", "斯里兰卡 sri lanka rupee"],
    ["NPR", "尼泊尔卢比", "Nepalese Rupee", "रू", "尼泊尔 nepal rupee"],
    ["MVR", "马尔代夫拉菲亚", "Maldivian Rufiyaa", "Rf", "马尔代夫 maldives rufiyaa"],
    ["AED", "阿联酋迪拉姆", "UAE Dirham", "د.إ", "阿联酋 迪拜 dubai united arab emirates"],
    ["SAR", "沙特里亚尔", "Saudi Riyal", "﷼", "沙特阿拉伯 saudi arabia riyal"],
    ["QAR", "卡塔尔里亚尔", "Qatari Riyal", "﷼", "卡塔尔 qatar riyal"],
    ["KWD", "科威特第纳尔", "Kuwaiti Dinar", "د.ك", "科威特 kuwait dinar"],
    ["BHD", "巴林第纳尔", "Bahraini Dinar", ".د.ب", "巴林 bahrain dinar"],
    ["OMR", "阿曼里亚尔", "Omani Rial", "﷼", "阿曼 oman rial"],
    ["JOD", "约旦第纳尔", "Jordanian Dinar", "د.ا", "约旦 jordan dinar"],
    ["ILS", "以色列新谢克尔", "Israeli New Shekel", "₪", "以色列 israel shekel"],
    ["TRY", "土耳其里拉", "Turkish Lira", "₺", "土耳其 türkiye turkey lira"],
    ["GEL", "格鲁吉亚拉里", "Georgian Lari", "₾", "格鲁吉亚 georgia lari"],
    ["AMD", "亚美尼亚德拉姆", "Armenian Dram", "֏", "亚美尼亚 armenia dram"],
    ["AZN", "阿塞拜疆马纳特", "Azerbaijani Manat", "₼", "阿塞拜疆 azerbaijan manat"],
    ["KZT", "哈萨克斯坦坚戈", "Kazakhstani Tenge", "₸", "哈萨克斯坦 kazakhstan tenge"],
    ["UZS", "乌兹别克斯坦苏姆", "Uzbekistani Som", "soʻm", "乌兹别克斯坦 uzbekistan som"],
    ["RUB", "俄罗斯卢布", "Russian Ruble", "₽", "俄罗斯 russian russia ruble"],
    ["UAH", "乌克兰格里夫纳", "Ukrainian Hryvnia", "₴", "乌克兰 ukraine hryvnia"],
    ["PLN", "波兰兹罗提", "Polish Zloty", "zł", "波兰 poland zloty"],
    ["CZK", "捷克克朗", "Czech Koruna", "Kč", "捷克 czechia czech koruna"],
    ["HUF", "匈牙利福林", "Hungarian Forint", "Ft", "匈牙利 hungary forint"],
    ["RON", "罗马尼亚列伊", "Romanian Leu", "lei", "罗马尼亚 romania leu"],
    ["BGN", "保加利亚列弗", "Bulgarian Lev", "лв", "保加利亚 bulgaria lev"],
    ["RSD", "塞尔维亚第纳尔", "Serbian Dinar", "дин", "塞尔维亚 serbia dinar"],
    ["SEK", "瑞典克朗", "Swedish Krona", "kr", "瑞典 sweden krona"],
    ["NOK", "挪威克朗", "Norwegian Krone", "kr", "挪威 norway krone"],
    ["DKK", "丹麦克朗", "Danish Krone", "kr", "丹麦 denmark krone"],
    ["ISK", "冰岛克朗", "Icelandic Krona", "kr", "冰岛 iceland krona"],
    ["CAD", "加拿大元", "Canadian Dollar", "C$", "加拿大 canada 加元"],
    ["AUD", "澳大利亚元", "Australian Dollar", "A$", "澳大利亚 澳洲 australia 澳元"],
    ["NZD", "新西兰元", "New Zealand Dollar", "NZ$", "新西兰 new zealand 纽币"],
    ["MXN", "墨西哥比索", "Mexican Peso", "Mex$", "墨西哥 mexico peso"],
    ["BRL", "巴西雷亚尔", "Brazilian Real", "R$", "巴西 brazil real"],
    ["ARS", "阿根廷比索", "Argentine Peso", "AR$", "阿根廷 argentina peso"],
    ["CLP", "智利比索", "Chilean Peso", "CLP$", "智利 chile peso"],
    ["COP", "哥伦比亚比索", "Colombian Peso", "COL$", "哥伦比亚 colombia peso"],
    ["PEN", "秘鲁索尔", "Peruvian Sol", "S/", "秘鲁 peru sol"],
    ["UYU", "乌拉圭比索", "Uruguayan Peso", "$U", "乌拉圭 uruguay peso"],
    ["BOB", "玻利维亚诺", "Bolivian Boliviano", "Bs", "玻利维亚 bolivia boliviano"],
    ["ZAR", "南非兰特", "South African Rand", "R", "南非 south africa rand"],
    ["EGP", "埃及镑", "Egyptian Pound", "E£", "埃及 egypt pound"],
    ["MAD", "摩洛哥迪拉姆", "Moroccan Dirham", "د.م.", "摩洛哥 morocco dirham"],
    ["KES", "肯尼亚先令", "Kenyan Shilling", "KSh", "肯尼亚 kenya shilling"],
    ["TZS", "坦桑尼亚先令", "Tanzanian Shilling", "TSh", "坦桑尼亚 tanzania shilling"],
    ["NGN", "尼日利亚奈拉", "Nigerian Naira", "₦", "尼日利亚 nigeria naira"],
    ["GHS", "加纳塞地", "Ghanaian Cedi", "₵", "加纳 ghana cedi"],
    ["ETB", "埃塞俄比亚比尔", "Ethiopian Birr", "Br", "埃塞俄比亚 ethiopia birr"],
    ["MUR", "毛里求斯卢比", "Mauritian Rupee", "₨", "毛里求斯 mauritius rupee"],
    ["FJD", "斐济元", "Fijian Dollar", "FJ$", "斐济 fiji"],
    ["XPF", "太平洋法郎", "CFP Franc", "₣", "法属波利尼西亚 新喀里多尼亚 tahiti cfp"],
    ["XCD", "东加勒比元", "East Caribbean Dollar", "EC$", "东加勒比 caribbean"],
    ["JMD", "牙买加元", "Jamaican Dollar", "J$", "牙买加 jamaica"],
    ["DOP", "多米尼加比索", "Dominican Peso", "RD$", "多米尼加 dominican peso"],
    ["CRC", "哥斯达黎加科朗", "Costa Rican Colon", "₡", "哥斯达黎加 costa rica colon"],
    ["PAB", "巴拿马巴波亚", "Panamanian Balboa", "B/.", "巴拿马 panama balboa"],
    ["MNT", "蒙古图格里克", "Mongolian Tugrik", "₮", "蒙古 mongolia tugrik"]
  ].map(([code, nameZh, nameEn, symbol, aliases]) => ({ code, nameZh, nameEn, symbol, aliases })));

  function buildCurrencyCatalog(seed) {
    const byCode = new Map(seed.map((currency) => [currency.code, currency]));
    if (typeof Intl.supportedValuesOf !== "function" || typeof Intl.DisplayNames !== "function") {
      return Object.freeze([...byCode.values()]);
    }
    try {
      const namesZh = new Intl.DisplayNames(["zh-CN"], { type: "currency" });
      const namesEn = new Intl.DisplayNames(["en"], { type: "currency" });
      Intl.supportedValuesOf("currency").forEach((code) => {
        if (byCode.has(code)) return;
        const symbolPart = new Intl.NumberFormat("en", {
          style: "currency",
          currency: code,
          currencyDisplay: "narrowSymbol"
        }).formatToParts(0).find((part) => part.type === "currency");
        byCode.set(code, {
          code,
          nameZh: namesZh.of(code) || code,
          nameEn: namesEn.of(code) || code,
          symbol: symbolPart?.value || code,
          aliases: ""
        });
      });
    } catch {
      return Object.freeze([...byCode.values()]);
    }
    return Object.freeze([...byCode.values()].sort((first, second) => first.code.localeCompare(second.code)));
  }

  const CURRENCY_CATALOG = buildCurrencyCatalog(SEEDED_CURRENCY_CATALOG);

  const CURRENCY_BY_CODE = new Map(CURRENCY_CATALOG.map((currency) => [currency.code, currency]));
  const currencySearchText = new Map(CURRENCY_CATALOG.map((currency) => [
    currency.code,
    normalizeSearch([currency.code, currency.nameZh, currency.nameEn, currency.symbol, currency.aliases].join(" "))
  ]));

  let ledgerRoot = null;
  let ledgerTripId = "";
  let ledgerAdapter = null;
  let ledgerPersistenceMode = "local";
  let ledgerData = null;
  let initialized = false;
  let activeTab = "entry";
  let billSortOrder = "asc";
  let editingBillId = null;
  let openDialogName = null;
  let currencyPickerMode = "common";
  let currencyQuery = "";
  let notice = "";
  let billDraft = null;
  let receiptDraft = "";
  let receiptRemoved = false;
  let editingMemberId = null;
  let editingNoteBillId = null;
  let pendingNoteSave = null;
  let noteOpenRequest = 0;
  let mutationQueue = Promise.resolve();

  function normalizeSearch(value) {
    return String(value || "")
      .normalize("NFKD")
      .toLocaleLowerCase()
      .replace(/[\s._/-]+/g, "");
  }

  function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, (character) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "\"": "&quot;",
      "'": "&#39;"
    })[character]);
  }

  function escapeAttribute(value = "") {
    return escapeHtml(value).replace(/`/g, "&#96;");
  }

  function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function makeId(prefix) {
    if (globalThis.crypto && typeof globalThis.crypto.randomUUID === "function") {
      return `${prefix}-${globalThis.crypto.randomUUID()}`;
    }
    return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  }

  function avatarInitial(name) {
    const characters = Array.from(String(name || "").trim());
    if (!characters.length) return "?";
    const firstHanIndex = characters.findIndex((character) => /\p{Script=Han}/u.test(character));
    if (firstHanIndex >= 0) {
      const firstHan = characters[firstHanIndex];
      if (["小", "阿", "老"].includes(firstHan)) {
        const nextHan = characters.slice(firstHanIndex + 1).find((character) => /\p{Script=Han}/u.test(character));
        if (nextHan) return nextHan;
      }
      return firstHan;
    }
    const latin = characters.find((character) => /[A-Za-z]/.test(character));
    return latin ? latin.toUpperCase() : characters[0].toUpperCase();
  }

  function nextAvatarColor(travelers) {
    const used = new Set(travelers.map((traveler) => traveler.color.toUpperCase()));
    return AVATAR_COLORS.find((color) => !used.has(color.toUpperCase()))
      || AVATAR_COLORS[travelers.length % AVATAR_COLORS.length];
  }

  function isValidColor(value) {
    return /^#[0-9a-f]{6}$/i.test(String(value || ""));
  }

  function currencyDigits(code = ledgerData?.settings.baseCurrency || "CNY") {
    return new Intl.NumberFormat("en", {style:"currency", currency:code}).resolvedOptions().maximumFractionDigits;
  }
  function currencyScale(code) { return 10 ** currencyDigits(code); }
  function toCents(value, code = ledgerData?.settings.baseCurrency || "CNY") {
    const normalized = String(value ?? "").trim().replace(/,/g, "");
    const digits = currencyDigits(code);
    const pattern = digits ? new RegExp("^(?:\\d+|\\d*\\.\\d{1,"+digits+"})$") : /^\d+$/;
    if (!pattern.test(normalized)) return null;
    const [whole="0",fraction=""] = normalized.split(".");
    const minor = Number(whole || 0)*currencyScale(code)+Number(fraction.padEnd(digits,"0"));
    return Number.isSafeInteger(minor) ? minor : null;
  }
  function centsToInput(minor, code = ledgerData?.settings.baseCurrency || "CNY") {
    return Number.isSafeInteger(minor) ? (minor / currencyScale(code)).toFixed(currencyDigits(code)) : "";
  }
  function formatMoney(minor, code) {
    return new Intl.NumberFormat("zh-CN",{style:"currency",currency:code}).format(Number(minor||0)/currencyScale(code));
  }
  function toBaseMinor(minor,code,rate,base=ledgerData.settings.baseCurrency) {
    return minor / currencyScale(code) * rate * currencyScale(base);
  }

  function defaultData() {
    return {
      version: STORAGE_VERSION,
      settings: deepClone(DEFAULT_SETTINGS),
      travelers: [],
      bills: [],
      updatedAt: new Date().toISOString()
    };
  }

  function normalizeData(raw) {
    const fallback = defaultData();
    if (!raw || typeof raw !== "object") return fallback;
    const rawTravelers = Array.isArray(raw.travelers) ? raw.travelers : [];
    const usedIds = new Set();
    const travelers = rawTravelers.flatMap((traveler, index) => {
      const name = String(traveler?.name || "").trim().slice(0, 30);
      let id = String(traveler?.id || "").trim();
      if (!name) return [];
      if (!id || usedIds.has(id)) id = makeId("person");
      usedIds.add(id);
      const color = isValidColor(traveler?.color)
        ? traveler.color.toUpperCase()
        : AVATAR_COLORS[index % AVATAR_COLORS.length];
      return [{ id, name, initial: avatarInitial(name), color }];
    });
    const travelerIds = new Set(travelers.map((traveler) => traveler.id));
    const requestedSelfId = String(raw.settings?.selfTravelerId || "");
    const selfTravelerId = travelerIds.has(requestedSelfId) ? requestedSelfId
      : "";
    const requestedBase = String(raw.settings?.baseCurrency || DEFAULT_SETTINGS.baseCurrency).toUpperCase();
    const baseCurrency = CURRENCY_BY_CODE.has(requestedBase) ? requestedBase : DEFAULT_SETTINGS.baseCurrency;
    const commonCurrencies = [...new Set(
      (Array.isArray(raw.settings?.commonCurrencies) ? raw.settings.commonCurrencies : DEFAULT_SETTINGS.commonCurrencies)
        .map((code) => String(code).toUpperCase())
        .filter((code) => CURRENCY_BY_CODE.has(code) && code !== baseCurrency)
    )];
    const availableCurrencies = new Set([baseCurrency, ...commonCurrencies]);
    const requestedLast = String(raw.settings?.lastCurrency || baseCurrency).toUpperCase();
    const lastCurrency = availableCurrencies.has(requestedLast) ? requestedLast : baseCurrency;
    const exchangeRates = Object.fromEntries(Object.entries(raw.settings?.exchangeRates || {})
      .filter(([code, rate]) => CURRENCY_BY_CODE.has(code) && Number.isFinite(Number(rate)) && Number(rate) > 0)
      .map(([code, rate]) => [code, Number(rate)]));
    const bills = (Array.isArray(raw.bills) ? raw.bills : []).flatMap((bill) => {
      const originalAmountCents = Number(bill?.originalAmountCents);
      const baseAmountCents = Number(bill?.baseAmountCents);
      const currency = String(bill?.currency || baseCurrency).toUpperCase();
      const payerId = String(bill?.payerId || "");
      const participantIds = [...new Set(Array.isArray(bill?.participantIds) ? bill.participantIds.map(String) : [])]
        .filter((id) => travelerIds.has(id));
      if (!Number.isSafeInteger(originalAmountCents) || originalAmountCents <= 0) return [];
      if (!Number.isSafeInteger(baseAmountCents) || baseAmountCents <= 0) return [];
      if (!CURRENCY_BY_CODE.has(currency) || !travelerIds.has(payerId) || !participantIds.length) return [];
      const category = CATEGORIES.includes(bill?.category) ? bill.category : "其他";
      return [{
        id: String(bill.id || makeId("bill")),
        originalAmountCents,
        baseAmountCents,
        currency,
        category,
        note: typeof bill.note === "string" ? bill.note.trim().slice(0, 160) : "",
        orderedAt: typeof bill.orderedAt === "string" ? bill.orderedAt : "",
        payerId,
        participantIds,
        splitMode: bill.splitMode === "custom" ? "custom" : "equal",
        sharesCents: bill.sharesCents && typeof bill.sharesCents === "object" ? bill.sharesCents : {},
        exchangeRate: Number(bill.exchangeRate) || null,
        receiptDataUrl: /^data:image\/(?:jpeg|png|webp);base64,/.test(bill.receiptDataUrl || "") && bill.receiptDataUrl.length < 500000 ? bill.receiptDataUrl : "",
        createdAt: typeof bill.createdAt === "string" ? bill.createdAt : new Date().toISOString(),
        updatedAt: typeof bill.updatedAt === "string" ? bill.updatedAt : new Date().toISOString()
      }];
    });
    return {
      version: STORAGE_VERSION,
      settings: { baseCurrency, commonCurrencies, lastCurrency, exchangeRates, selfTravelerId },
      travelers,
      bills,
      updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : fallback.updatedAt
    };
  }

  function createLocalStorageAdapter(tripId, options = {}) {
    const runtimeStorage = globalThis.TravelRuntimeStorage;
    if (runtimeStorage?.createAdapter) {
      return runtimeStorage.createAdapter({
        ...options,
        mode: "local",
        tripId,
        collections: ["settings", "travelers", "bills"]
      });
    }

    const storageKey = options.storageKey
      || `travel-plan:runtime:v1:${encodeURIComponent(String(tripId || "default-trip"))}`;
    let memorySnapshot = null;
    let storage = options.storage;
    if (!storage) {
      try {
        storage = globalThis.localStorage || null;
      } catch {
        storage = null;
      }
    }

    function readSnapshot() {
      if (!storage) return memorySnapshot ? deepClone(memorySnapshot) : null;
      try {
        const serialized = storage.getItem(storageKey);
        if (!serialized) return memorySnapshot ? deepClone(memorySnapshot) : null;
        const parsed = JSON.parse(serialized);
        memorySnapshot = parsed && typeof parsed === "object" ? parsed : null;
        return memorySnapshot ? deepClone(memorySnapshot) : null;
      } catch (error) {
        console.warn("TravelLedger could not read localStorage; using memory for this tab.", error);
        storage = null;
        return memorySnapshot ? deepClone(memorySnapshot) : null;
      }
    }

    function writeSnapshot(next) {
      const previous = readSnapshot() || {};
      const snapshot = {
        ...previous,
        version: STORAGE_VERSION,
        settings: deepClone(next.settings),
        travelers: deepClone(next.travelers),
        bills: deepClone(next.bills),
        updatedAt: next.updatedAt
      };
      memorySnapshot = snapshot;
      if (storage) {
        try {
          storage.setItem(storageKey, JSON.stringify(snapshot));
        } catch (error) {
          console.warn("TravelLedger could not write localStorage; using memory for this tab.", error);
          storage = null;
        }
      }
      Object.assign(next, deepClone(snapshot));
      return deepClone(snapshot);
    }

    return {
      mode: "local",
      tripId,
      storageKey,
      async load() {
        return readSnapshot();
      },
      async save(next) {
        return writeSnapshot(next);
      }
    };
  }

  function createD1Adapter() { throw new Error("请为自己的项目配置并验证独立存储适配器。"); }

  async function resolveTripConfig(root, options) {
    if (options.config && typeof options.config === "object") return options.config;
    if (globalThis.TRAVEL_PLAN_CONFIG && typeof globalThis.TRAVEL_PLAN_CONFIG === "object") {
      return globalThis.TRAVEL_PLAN_CONFIG;
    }
    if (options.configUrl === false) return {};
    const configUrl = options.configUrl || root.dataset.tripConfigUrl || "trip-data.json";
    try {
      const response = await fetch(configUrl, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        return payload?.config && typeof payload.config === "object" ? payload.config : payload;
      }
    } catch {
      // A missing optional config must never prevent the local-first ledger from opening.
    }
    return {};
  }

  function resolvePersistence(root, options, config) {
    const optionPersistence = options.persistence && typeof options.persistence === "object"
      ? options.persistence
      : {};
    const configPersistence = config?.persistence && typeof config.persistence === "object"
      ? config.persistence
      : {};
    const requestedMode = options.persistenceMode
      || optionPersistence.mode
      || root.dataset.ledgerPersistence
      || configPersistence.mode;
    const sharedCollections = Array.isArray(optionPersistence.sharedCollections)
      ? optionPersistence.sharedCollections
      : Array.isArray(configPersistence.sharedCollections)
        ? configPersistence.sharedCollections
        : [];
    const d1Requested = String(requestedMode || "").trim().toLowerCase() === "d1";
    const mode = d1Requested && sharedCollections.includes("ledger") ? "d1" : "local";
    const d1Options = {
      ...(configPersistence.d1 && typeof configPersistence.d1 === "object" ? configPersistence.d1 : {}),
      ...(optionPersistence.d1 && typeof optionPersistence.d1 === "object" ? optionPersistence.d1 : {}),
      ...(options.d1 && typeof options.d1 === "object" ? options.d1 : {})
    };
    if (configPersistence.apiBase) d1Options.apiBase = configPersistence.apiBase;
    if (optionPersistence.apiBase) d1Options.apiBase = optionPersistence.apiBase;
    const localOptions = {
      ...(configPersistence.local && typeof configPersistence.local === "object" ? configPersistence.local : {}),
      ...(optionPersistence.local && typeof optionPersistence.local === "object" ? optionPersistence.local : {})
    };
    if (options.storage) localOptions.storage = options.storage;
    if (options.storageKey) localOptions.storageKey = options.storageKey;
    return { mode, d1Options, localOptions };
  }

  async function resolveTripId(root, options) {
    const explicit = options.tripId || root.dataset.tripId || document.documentElement.dataset.tripId || document.body?.dataset.tripId;
    if (explicit) return String(explicit);
    if (globalThis.TRAVEL_PLAN_DATA?.metadata?.tripId) return String(globalThis.TRAVEL_PLAN_DATA.metadata.tripId);
    try {
      const dataUrl = options.travelDataUrl || root.dataset.travelDataUrl || "trip-data.json";
      const response = await fetch(dataUrl, { cache: "no-store" });
      if (response.ok) {
        const travelData = await response.json();
        if (travelData?.metadata?.tripId) return String(travelData.metadata.tripId);
      }
    } catch {
      // A stable path-based key still keeps unrelated trips separated offline.
    }
    const pathKey = location.pathname.replace(/[^a-z0-9\u3400-\u9fff]+/gi, "-").replace(/^-|-$/g, "");
    return pathKey || "default-trip";
  }

  function travelerById(id) {
    return ledgerData.travelers.find((traveler) => traveler.id === id);
  }

  function currencyByCode(code) {
    return CURRENCY_BY_CODE.get(code) || { code, nameZh: code, nameEn: code, symbol: code };
  }

  function availableCurrencyCodes(extraCode = "") {
    return [...new Set([
      ledgerData.settings.baseCurrency,
      ...ledgerData.settings.commonCurrencies,
      extraCode
    ].filter((code) => CURRENCY_BY_CODE.has(code)))];
  }

  function billShares(bill) {
    const participantIds = bill.participantIds.filter((id) => travelerById(id));
    if (!participantIds.length) return new Map();
    if (bill.splitMode === "custom" && participantIds.every((id) => Number.isSafeInteger(Number(bill.sharesCents?.[id])))
      && participantIds.reduce((sum, id) => sum + Number(bill.sharesCents[id]), 0) === bill.baseAmountCents) {
      return new Map(participantIds.map((id) => [id, Number(bill.sharesCents[id])]));
    }
    const share = Math.floor(bill.baseAmountCents / participantIds.length);
    let remainder = bill.baseAmountCents - share * participantIds.length;
    return new Map(participantIds.map((id) => {
      const amount = share + (remainder > 0 ? 1 : 0);
      remainder -= remainder > 0 ? 1 : 0;
      return [id, amount];
    }));
  }

  function calculateCurrencySettlement(bills, travelerIds, baseCurrency = "CNY") {
    const groups = new Map();
    for (const bill of bills) {
      const currency = bill.currency;
      if (!groups.has(currency)) groups.set(currency, {
        currency, originalTotalCents: 0, conversionExactCents: 0,
        paidOriginal: new Map(), paidBaseExact: new Map(), owedOriginalExact: new Map()
      });
      const group = groups.get(currency);
      const rate = currency === baseCurrency ? 1
        : Number(bill.exchangeRate) || (bill.baseAmountCents / currencyScale(baseCurrency)) / (bill.originalAmountCents / currencyScale(currency));
      const convertedExact = toBaseMinor(bill.originalAmountCents, currency, rate, baseCurrency);
      group.originalTotalCents += bill.originalAmountCents;
      group.conversionExactCents += convertedExact;
      group.paidOriginal.set(bill.payerId, (group.paidOriginal.get(bill.payerId) || 0) + bill.originalAmountCents);
      group.paidBaseExact.set(bill.payerId, (group.paidBaseExact.get(bill.payerId) || 0) + convertedExact);
      const participants = [...new Set(bill.participantIds)].filter((id) => travelerIds.includes(id));
      if (!participants.length) continue;
      const custom = bill.splitMode === "custom" && participants.every((id) => Number.isSafeInteger(Number(bill.sharesCents?.[id])))
        && participants.reduce((sum, id) => sum + Number(bill.sharesCents[id]), 0) === bill.baseAmountCents;
      for (const id of participants) {
        const fraction = custom ? Number(bill.sharesCents[id]) / bill.baseAmountCents : 1 / participants.length;
        group.owedOriginalExact.set(id,
          (group.owedOriginalExact.get(id) || 0) + bill.originalAmountCents * fraction);
      }
    }
    const memberAmounts = new Map(travelerIds.map((id) => [id, { paidExactCents: 0, owedExactCents: 0 }]));
    const transfers = [];
    let totalCents = 0;
    for (const group of groups.values()) {
      const { currency, originalTotalCents } = group;
      const rate = group.conversionExactCents / originalTotalCents;
      totalCents += Math.round(group.conversionExactCents);
      for (const id of travelerIds) {
        memberAmounts.get(id).paidExactCents += group.paidBaseExact.get(id) || 0;
        memberAmounts.get(id).owedExactCents += (group.owedOriginalExact.get(id) || 0) * rate;
      }
      const balances = new Map(travelerIds.map((id) => [id,
        (group.paidOriginal.get(id) || 0) - (group.owedOriginalExact.get(id) || 0)]));
      const debtors = [...balances].filter(([, amount]) => amount < -1e-7).map(([id, amount]) => ({ id, amount: -amount }));
      const creditors = [...balances].filter(([, amount]) => amount > 1e-7).map(([id, amount]) => ({ id, amount }));
      debtors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
      creditors.sort((a, b) => b.amount - a.amount || a.id.localeCompare(b.id));
      const currencyTransfers = [];
      let debtorIndex = 0;
      let creditorIndex = 0;
      while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
        const debtor = debtors[debtorIndex];
        const creditor = creditors[creditorIndex];
        const originalAmountCents = Math.min(debtor.amount, creditor.amount);
        currencyTransfers.push({
          fromId: debtor.id, toId: creditor.id, currency, rate,
          originalExactCents: originalAmountCents,
          baseExactCents: originalAmountCents * rate,
          originalAmountCents: Math.round(originalAmountCents),
          baseAmountCents: Math.round(originalAmountCents * rate)
        });
        debtor.amount -= originalAmountCents;
        creditor.amount -= originalAmountCents;
        if (debtor.amount < 1e-7) debtorIndex++;
        if (creditor.amount < 1e-7) creditorIndex++;
      }
      transfers.push(...currencyTransfers);
    }
    return {
      transfers, totalCents,
      memberAmounts: new Map([...memberAmounts].map(([id, amounts]) => [id, {
        paidCents: Math.round(amounts.paidExactCents),
        owedCents: Math.round(amounts.owedExactCents)
      }]))
    };
  }

  function calculateCurrencyTransfers(bills, travelerIds, _sharesForBill, baseCurrency = "CNY") {
    return calculateCurrencySettlement(bills, travelerIds, baseCurrency).transfers;
  }

  function groupTransfersByPeople(transfers) {
    const groups = new Map();
    for (const transfer of transfers) {
      const key = JSON.stringify([transfer.fromId, transfer.toId]);
      if (!groups.has(key)) groups.set(key, {
        fromId: transfer.fromId, toId: transfer.toId,
        currencies: new Map(), baseExactCents: 0
      });
      const group = groups.get(key);
      group.baseExactCents += transfer.baseExactCents;
      group.currencies.set(
        transfer.currency,
        (group.currencies.get(transfer.currency) || 0) + transfer.originalExactCents
      );
    }
    return [...groups.values()].map((group) => ({
      ...group,
      baseAmountCents: Math.round(group.baseExactCents),
      currencies: [...group.currencies].map(([currency, exactCents]) => ({ currency, amountCents: Math.round(exactCents) }))
    }));
  }

  function calculateStats() {
    const settlement = calculateCurrencySettlement(
      ledgerData.bills,
      ledgerData.travelers.map((traveler) => traveler.id),
      ledgerData.settings.baseCurrency
    );
    const members = ledgerData.travelers.map((traveler) => ({
      traveler,
      paidCents: settlement.memberAmounts.get(traveler.id).paidCents,
      owedCents: settlement.memberAmounts.get(traveler.id).owedCents,
      netCents: 0,
      billIds: []
    }));
    const byId = new Map(members.map((entry) => [entry.traveler.id, entry]));
    ledgerData.bills.forEach((bill) => {
      const payer = byId.get(bill.payerId);
      if (payer) {
        payer.billIds.push(bill.id);
      }
      billShares(bill).forEach((_, participantId) => {
        const member = byId.get(participantId);
        if (!member) return;
        if (!member.billIds.includes(bill.id)) member.billIds.push(bill.id);
      });
    });
    groupTransfersByPeople(settlement.transfers).forEach((transfer) => {
      byId.get(transfer.fromId).netCents -= transfer.baseAmountCents;
      byId.get(transfer.toId).netCents += transfer.baseAmountCents;
    });

    return {
      totalCents: settlement.totalCents,
      members,
      currencyTransfers: settlement.transfers
    };
  }

  function renderAvatar(traveler, size = "normal") {
    if (!traveler) return "";
    return `<span class="ledger-avatar ledger-avatar-${escapeAttribute(size)}" style="--ledger-avatar-color:${escapeAttribute(traveler.color)}" aria-hidden="true">${escapeHtml(traveler.initial)}</span>`;
  }

  function renderPersonChoice(traveler, type, name, selected) {
    return `
      <label class="ledger-person-choice">
        <input class="ledger-person-input" type="${type}" name="${escapeAttribute(name)}" value="${escapeAttribute(traveler.id)}" ${selected ? "checked" : ""}>
        <span class="ledger-person-visual">
          ${renderAvatar(traveler)}
          <span class="ledger-person-check" aria-hidden="true">✓</span>
        </span>
        <span class="ledger-person-name">${escapeHtml(traveler.name)}</span>
      </label>`;
  }

  function renderCurrencyOptions(selectedCode) {
    return availableCurrencyCodes(selectedCode).map((code) => {
      const currency = currencyByCode(code);
      return `<button class="ledger-currency-option" type="button" data-ledger-action="choose-bill-currency" data-ledger-code="${escapeAttribute(code)}" ${code === selectedCode ? "aria-current=\"true\"" : ""}><b>${escapeHtml(code)}</b><span>${escapeHtml(currency.nameZh)}</span></button>`;
    }).join("");
  }

  function renderBillForm() {
    const editingBill = ledgerData.bills.find((bill) => bill.id === editingBillId) || null;
    const draft = editingBill ? null : billDraft;
    const currency = editingBill?.currency || draft?.currency || ledgerData.settings.lastCurrency;
    const baseCurrency = ledgerData.settings.baseCurrency;
    const isForeign = currency !== baseCurrency;
    const selectedParticipants = new Set(
      editingBill?.participantIds
      || draft?.participantIds
      || ledgerData.travelers.map((traveler) => traveler.id)
    );
    const selectedPayerId = editingBill?.payerId || draft?.payerId || "";
    const selectedCategory = editingBill?.category || draft?.category || "餐饮";
    const selectedSplitMode = editingBill?.splitMode || draft?.splitMode || "equal";
    const selectedShares = editingBill?.sharesCents || draft?.sharesCents || {};
    const localNow = new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    const rate = Number(ledgerData.settings.exchangeRates?.[currency]) || 0;
    return `
      <section class="ledger-entry-card" aria-labelledby="ledger-bill-form-title">
        <div class="ledger-section-heading">
          <div>
            <p class="ledger-section-kicker">${editingBill ? "编辑账单" : "记一笔"}</p>
            <h2 id="ledger-bill-form-title">${editingBill ? "修改这笔账" : "记录本次花费"}</h2>
          </div>
          ${editingBill ? `<button class="ledger-text-button" type="button" data-ledger-action="cancel-edit">取消编辑</button>` : ""}
        </div>
        ${ledgerData.travelers.length ? `
          <form class="ledger-bill-form" data-ledger-form="bill" novalidate>
            <label class="ledger-field ledger-date-field">
              <span class="ledger-field-label">下单时间</span>
              <input class="ledger-input" type="datetime-local" name="orderedAt" value="${escapeAttribute(editingBill?.orderedAt || draft?.orderedAt || localNow)}" required>
            </label>
            <div class="ledger-amount-block">
              <label class="ledger-field ledger-field-currency">
                <span class="ledger-field-label">币种</span>
                <input type="hidden" name="currency" data-ledger-field="currency" value="${escapeAttribute(currency)}">
                <details class="ledger-currency-dropdown">
                  <summary><span data-ledger-currency-display>${escapeHtml(currency)} · ${escapeHtml(currencyByCode(currency).nameZh)}</span><span aria-hidden="true">⌄</span></summary>
                  <div class="ledger-currency-menu">${renderCurrencyOptions(currency)}</div>
                </details>
              </label>
              <label class="ledger-field ledger-field-amount">
                <span class="ledger-field-label">金额</span>
                <input class="ledger-amount-input" name="originalAmount" data-ledger-field="original-amount" type="text" inputmode="decimal" autocomplete="off" placeholder="0.00" value="${escapeAttribute(editingBill ? centsToInput(editingBill.originalAmountCents, currency) : draft?.originalAmount || "")}" required>
              </label>
            </div>
            <label class="ledger-field ledger-converted-field" data-ledger-converted-field ${isForeign ? "" : "hidden"}>
              <span class="ledger-converted-compact" data-ledger-converted-compact aria-live="polite"></span>
              <span class="ledger-field-label">折合${escapeHtml(currencyByCode(baseCurrency).nameZh)}</span>
              <span class="ledger-converted-input-wrap">
                <span class="ledger-converted-code">${escapeHtml(baseCurrency)}</span>
                <input class="ledger-input" name="baseAmount" data-ledger-field="base-amount" type="text" readonly value="${escapeAttribute(editingBill && isForeign ? centsToInput(editingBill.baseAmountCents) : draft?.baseAmount || "")}">
              </span>
              <small class="ledger-field-help" data-ledger-rate-help>${rate ? `统一汇率：1 ${escapeHtml(currency)} = ${rate} ${escapeHtml(baseCurrency)}` : "请先到右上角「设置」填写统一汇率"}</small>
            </label>

            <fieldset class="ledger-fieldset">
              <legend class="ledger-field-label">分类</legend>
              <div class="ledger-category-grid">
                ${CATEGORIES.map((category) => `
                  <label class="ledger-category-choice">
                    <input class="ledger-category-input" type="radio" name="category" value="${escapeAttribute(category)}" ${category === selectedCategory ? "checked" : ""}>
                    <span>${escapeHtml(category)}</span>
                  </label>`).join("")}
              </div>
            </fieldset>

            <label class="ledger-field ledger-note-field">
              <span class="ledger-field-label">备注 <small>必填</small></span>
              <input class="ledger-input" type="text" name="note" maxlength="160" autocomplete="off" placeholder="例如：演唱会门票" value="${escapeAttribute(editingBill?.note || draft?.note || "")}" required>
            </label>

            <fieldset class="ledger-fieldset">
              <legend class="ledger-field-label">买单人 <small>单选</small></legend>
              <div class="ledger-person-grid">
                ${ledgerData.travelers.map((traveler) => renderPersonChoice(traveler, "radio", "payerId", selectedPayerId === traveler.id)).join("")}
              </div>
            </fieldset>

            <fieldset class="ledger-fieldset">
              <div class="ledger-fieldset-heading">
                <legend class="ledger-field-label">参与分账人 <small>多选</small></legend>
                <button class="ledger-text-button" type="button" data-ledger-action="select-all-participants">全选</button>
              </div>
              <div class="ledger-person-grid">
                ${ledgerData.travelers.map((traveler) => renderPersonChoice(traveler, "checkbox", "participantIds", selectedParticipants.has(traveler.id))).join("")}
              </div>
              <div class="ledger-split-tools">
              <div class="ledger-split-modes" role="group" aria-label="分账方式">
                <label><input type="radio" name="splitMode" value="equal" ${selectedSplitMode === "equal" ? "checked" : ""}> 平分</label>
                <label><input type="radio" name="splitMode" value="custom" ${selectedSplitMode === "custom" ? "checked" : ""}> 自定义</label>
              </div>
              <div class="ledger-custom-shares" data-ledger-custom-shares ${selectedSplitMode === "custom" ? "" : "hidden"}>
                ${ledgerData.travelers.map((traveler) => `<label data-ledger-share-row="${escapeAttribute(traveler.id)}">${escapeHtml(traveler.name)} <input class="ledger-input" type="text" inputmode="decimal" name="share-${escapeAttribute(traveler.id)}" value="${escapeAttribute(selectedShares[traveler.id] != null ? centsToInput(Number(selectedShares[traveler.id])) : "")}" placeholder="分摊金额（${escapeHtml(baseCurrency)}）"></label>`).join("")}
              </div>
              <p class="ledger-split-summary" data-ledger-split-summary></p>
              </div>
            </fieldset>
            <label class="ledger-field ledger-receipt-field">
              <span class="ledger-receipt-compact">📎 ${receiptDraft || (!receiptRemoved && editingBill?.receiptDataUrl) ? '更换照片' : '添加照片'}</span>
              <span class="ledger-field-label">账单照片 <small>选填</small></span>
              <input type="file" name="receipt" accept="image/jpeg,image/png,image/webp" data-ledger-receipt>
              <small class="ledger-field-help">照片会压缩后保存到当前账本</small>
            </label>
            ${receiptDraft || (!receiptRemoved && editingBill?.receiptDataUrl) ? `<div class="ledger-receipt-preview"><img src="${receiptDraft || editingBill?.receiptDataUrl}" alt="账单照片预览"><button type="button" data-ledger-action="remove-receipt">移除照片</button></div>` : ""}

            <p class="ledger-form-error" data-ledger-form-error role="alert"></p>
            <button class="ledger-primary-button" type="submit">${editingBill ? "保存修改" : "保存账单"}</button>
          </form>` : `
          <div class="ledger-onboarding">
            <p>先添加本次同行人，再开始记账。</p>
            <button class="ledger-primary-button" type="button" data-ledger-action="open-members">添加同行人</button>
          </div>`}
      </section>`;
  }

  function formatBillDate(value) {
    if (!value) return "未填写时间";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return value.replace("T", " ");
    return new Intl.DateTimeFormat("zh-CN", {
      month: "numeric",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    }).format(parsed);
  }

  function billTimestamp(bill) {
    const timestamp = Date.parse(bill.orderedAt || bill.createdAt || "");
    return Number.isFinite(timestamp) ? timestamp : 0;
  }

  function billDayKey(bill) {
    const date = new Date(billTimestamp(bill));
    if (!billTimestamp(bill)) return "日期待补充";
    return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "long", day: "numeric", weekday: "long" }).format(date);
  }

  function renderBillNoteControl(bill, options = {}) {
    const editing = options.editing ?? editingNoteBillId === bill.id;
    const value = options.value ?? bill.note ?? "";
    return editing ? `
      <form class="ledger-bill-note-form" data-ledger-form="bill-note" data-ledger-id="${escapeAttribute(bill.id)}">
        <input name="note" maxlength="160" autocomplete="off" value="${escapeAttribute(value)}" placeholder="暂无">
        <button type="submit" aria-label="保存备注">✓</button>
        <button type="button" data-ledger-action="cancel-note-edit" aria-label="取消修改备注">×</button>
      </form>` : `
      <button class="ledger-bill-note-trigger" type="button" data-ledger-action="edit-bill-note" data-ledger-id="${escapeAttribute(bill.id)}" aria-label="编辑备注：${escapeAttribute(bill.note || "暂无")}">
        <span>${escapeHtml(bill.note || "未填写内容")}</span>
      </button>`;
  }

  function billRowById(id) {
    return [...(ledgerRoot?.querySelectorAll("[data-ledger-bill-id]") || [])]
      .find((row) => row.dataset.ledgerBillId === id) || null;
  }

  function replaceBillNoteControl(id, editing, value) {
    const bill = ledgerData.bills.find((entry) => entry.id === id);
    const row = billRowById(id);
    const current = row?.querySelector(".ledger-bill-note-trigger, .ledger-bill-note-form");
    if (!bill || !current) return null;
    const template = document.createElement("template");
    template.innerHTML = renderBillNoteControl(bill, { editing, value }).trim();
    const replacement = template.content.firstElementChild;
    current.replaceWith(replacement);
    return replacement;
  }

  function activeBillNoteForm() {
    return editingNoteBillId
      ? ledgerRoot?.querySelector('[data-ledger-form="bill-note"]') || null
      : null;
  }

  function focusBillNoteForm(form) {
    const input = form?.querySelector('input[name="note"]');
    input?.focus({ preventScroll: true });
    input?.select();
  }

  async function flushActiveBillNote() {
    if (pendingNoteSave) return pendingNoteSave;
    const form = activeBillNoteForm();
    if (!form) {
      editingNoteBillId = null;
      return true;
    }
    return submitBillNote(form);
  }

  async function openBillNoteEditor(id) {
    const request = ++noteOpenRequest;
    const bill = ledgerData.bills.find((entry) => entry.id === id);
    if (!bill) return;
    if (editingBillId === id) {
      const fullBillNote = ledgerRoot.querySelector('[data-ledger-form="bill"] input[name="note"]');
      fullBillNote?.scrollIntoView({ behavior: "smooth", block: "center" });
      fullBillNote?.focus({ preventScroll: true });
      fullBillNote?.select();
      return;
    }
    if (editingNoteBillId === id) {
      focusBillNoteForm(activeBillNoteForm());
      return;
    }
    if (!(await flushActiveBillNote()) || request !== noteOpenRequest) return;
    editingNoteBillId = id;
    const editor = replaceBillNoteControl(id, true, bill.note || "");
    focusBillNoteForm(editor);
  }

  function cancelBillNoteEditor() {
    noteOpenRequest += 1;
    const id = editingNoteBillId;
    editingNoteBillId = null;
    if (id) replaceBillNoteControl(id, false);
  }

  function handleDocumentPointerDown(event) {
    const form = activeBillNoteForm();
    if (!form || form.contains(event.target)) return;
    const actionTarget = event.target.closest?.("[data-ledger-action]");
    if (actionTarget?.dataset.ledgerAction === "delete-bill") {
      cancelBillNoteEditor();
      return;
    }
    const nextNote = event.target.closest?.('[data-ledger-action="edit-bill-note"]');
    if (nextNote && ledgerRoot?.contains(nextNote)) return;
    void flushActiveBillNote();
  }

  function renderBillRow(bill) {
    const payer = travelerById(bill.payerId);
    const participants = bill.participantIds.map(travelerById).filter(Boolean);
    const baseCurrency = ledgerData.settings.baseCurrency;
    return `
      <article class="ledger-bill-row" data-ledger-bill-id="${escapeAttribute(bill.id)}">
        <div class="ledger-bill-main">
          <div class="ledger-bill-title-row">
            <div>
              ${renderBillNoteControl(bill)}
              <p class="ledger-bill-subline"><span class="ledger-category-mark" data-ledger-category="${escapeAttribute(bill.category)}" aria-hidden="true"></span>${escapeHtml(bill.category)}${bill.orderedAt ? ` · ${escapeHtml(formatBillDate(bill.orderedAt))}` : ""}</p>
            </div>
          </div>
          <div class="ledger-bill-amount">
            <strong>${escapeHtml(formatMoney(bill.originalAmountCents, bill.currency))}</strong>
            ${bill.currency !== baseCurrency ? `<span>折合 ${escapeHtml(formatMoney(bill.baseAmountCents, baseCurrency))}</span>` : ""}
          </div>
        </div>
        <div class="ledger-bill-footer">
          <div class="ledger-bill-people" aria-label="买单：${escapeAttribute(payer?.name || "")}；参与分账：${escapeAttribute(participants.map((person) => person.name).join("、"))}">
            ${escapeHtml(payer?.name || "")}买单 · ${participants.length}人${bill.splitMode === "custom" ? "自定义" : "平分"}
          </div>
          <div class="ledger-row-actions">
            <button class="ledger-text-button" type="button" data-ledger-action="edit-bill" data-ledger-id="${escapeAttribute(bill.id)}" aria-label="编辑账单：${escapeAttribute(bill.note || bill.category)}">编辑</button>
            <button class="ledger-text-button ledger-danger-button" type="button" data-ledger-action="delete-bill" data-ledger-id="${escapeAttribute(bill.id)}" aria-label="删除账单：${escapeAttribute(bill.note || bill.category)}">删除</button>
          </div>
        </div>
        ${bill.receiptDataUrl ? `<a class="ledger-receipt-link" href="${bill.receiptDataUrl}" target="_blank" rel="noopener" download="账单照片.jpg"><img src="${bill.receiptDataUrl}" alt="查看账单照片">查看账单照片</a>` : ""}
      </article>`;
  }

  function personalTravelCost(stats = calculateStats()) {
    const traveler = travelerById(ledgerData.settings.selfTravelerId);
    const member = traveler ? stats.members.find((entry) => entry.traveler.id === traveler.id) : null;
    return { traveler, amountCents: member ? member.owedCents : null };
  }

  function renderBillList() {
    const baseCurrency = ledgerData.settings.baseCurrency;
    const personal = personalTravelCost();
    const bills = [...ledgerData.bills].sort((first, second) =>
      (billSortOrder === "asc" ? 1 : -1) * (billTimestamp(first) - billTimestamp(second))
      || first.id.localeCompare(second.id));
    let previousDay = "";
    const datedBills = bills.map((bill) => {
      const day = billDayKey(bill);
      const heading = day === previousDay ? "" : `<h3 class="ledger-bill-day">${escapeHtml(day)}</h3>`;
      previousDay = day;
      return heading + renderBillRow(bill);
    }).join("");
    return `
      <section class="ledger-list-section" aria-labelledby="ledger-list-title">
        <div class="ledger-section-heading ledger-list-heading">
          <div>
            <p class="ledger-section-kicker">账单明细</p>
            <h2 id="ledger-list-title">${bills.length ? `${bills.length} 笔账单` : "还没有账单"}</h2>
          </div>
          <div class="ledger-list-total">
            <span>我的旅行花费</span>
            <strong>${personal.traveler ? escapeHtml(formatMoney(personal.amountCents, baseCurrency)) : "—"}</strong>
            <small>${personal.traveler ? escapeHtml(personal.traveler.name) + " · 本人承担" : "请在设置中选择本人"}</small>
          </div>
        </div>
        ${bills.length ? `<button class="ledger-sort-button" type="button" data-ledger-action="toggle-bill-sort" aria-label="切换账单时间顺序">按下单时间 · ${billSortOrder === "asc" ? "最早在前" : "最新在前"} ↕</button>` : ""}
        ${bills.length
          ? `<div class="ledger-bill-list">${datedBills}</div>`
          : `<div class="ledger-empty-state"><p>记下第一笔花费后，账单会显示在这里。</p></div>`}
      </section>`;
  }

  function renderEntryPage() {
    return `
      <section class="ledger-tab-panel" data-ledger-panel="entry" role="tabpanel" aria-labelledby="ledger-entry-tab" ${activeTab === "entry" ? "" : "hidden"}>
        ${renderBillForm()}
        ${renderBillList()}
      </section>`;
  }

  function renderRelatedBills(member) {
    if (!member.billIds.length) return `<p class="ledger-member-empty">暂无相关账单</p>`;
    return member.billIds.map((billId) => {
      const bill = ledgerData.bills.find((entry) => entry.id === billId);
      if (!bill) return "";
      const share = billShares(bill).get(member.traveler.id) || 0;
      return `
        <div class="ledger-member-bill">
          <span>${escapeHtml(bill.category)}${bill.payerId === member.traveler.id ? " · 买单" : ""}</span>
          <span>${share ? `分摊 ${escapeHtml(formatMoney(share, ledgerData.settings.baseCurrency))}` : "未参与分摊"}</span>
        </div>`;
    }).join("");
  }

  function renderStatsPage() {
    const stats = calculateStats();
    const baseCurrency = ledgerData.settings.baseCurrency;
    const peopleTransfers = groupTransfersByPeople(stats.currencyTransfers);
    const personal = personalTravelCost(stats);
    return `
      <section class="ledger-tab-panel" data-ledger-panel="stats" role="tabpanel" aria-labelledby="ledger-stats-tab" ${activeTab === "stats" ? "" : "hidden"}>
        <section class="ledger-stats-overview" aria-labelledby="ledger-stats-title">
          <p class="ledger-section-kicker">我的旅行花费</p>
          <h2 id="ledger-stats-title">${personal.traveler ? escapeHtml(formatMoney(personal.amountCents, baseCurrency)) : "—"}</h2>
          <span>${personal.traveler ? escapeHtml(personal.traveler.name) + " · 仅含本人承担的份额 · 折合" + escapeHtml(currencyByCode(baseCurrency).nameZh) : "请在设置中选择本人，查看个人花费"}</span>
        </section>

        <section class="ledger-settlement-section" aria-labelledby="ledger-settlement-title">
          <div class="ledger-section-heading">
            <div>
              <p class="ledger-section-kicker">结算方案</p>
              <h2 id="ledger-settlement-title">按人员结算</h2>
            </div>
            <span class="ledger-soft-count">${peopleTransfers.length} 组转账</span>
          </div>
          <p class="ledger-settlement-hint">先按币种汇总并分摊，同样的份额按相同金额转账；每个人的合计最后独立四舍五入，不强制补齐总账的分尾差。</p>
          ${peopleTransfers.length ? `
            <div class="ledger-transfer-list">
              ${peopleTransfers.map((transfer) => {
                const from = travelerById(transfer.fromId);
                const to = travelerById(transfer.toId);
                return `
                  <div class="ledger-transfer-row">
                    <div class="ledger-transfer-person">
                      ${renderAvatar(from)}
                      <span><strong>${escapeHtml(from?.name || "")} → ${escapeHtml(to?.name || "")}</strong><small>按原币种分别转账</small></span>
                    </div>
                    <span class="ledger-transfer-values">
                      ${transfer.currencies.map((entry) => `<strong class="ledger-transfer-amount">${escapeHtml(formatMoney(entry.amountCents, entry.currency))}</strong>`).join("")}
                      ${transfer.currencies.length > 1 || transfer.currencies[0].currency !== baseCurrency ? `<small>合计约 ${escapeHtml(formatMoney(transfer.baseAmountCents, baseCurrency))}</small>` : ""}
                    </span>
                  </div>`;
              }).join("")}
            </div>` : `
            <div class="ledger-empty-state"><p>${ledgerData.bills.length ? "大家已经结清，无需转账。" : "添加账单后，这里会自动生成结算单。"}</p></div>`}
        </section>

      </section>`;
  }

  function renderMemberEditRow(traveler) {
    if (editingMemberId === traveler.id) {
      return `
        <form class="ledger-member-edit-row ledger-member-edit-row-is-open" data-ledger-form="member-edit" data-ledger-id="${escapeAttribute(traveler.id)}">
          ${renderAvatar(traveler)}
          <label class="ledger-visually-hidden" for="ledger-name-${escapeAttribute(traveler.id)}">成员姓名</label>
          <input class="ledger-input" id="ledger-name-${escapeAttribute(traveler.id)}" name="name" maxlength="30" value="${escapeAttribute(traveler.name)}" required>
          <label class="ledger-color-picker" title="修改头像颜色">
            <span class="ledger-visually-hidden">头像颜色</span>
            <input type="color" name="color" value="${escapeAttribute(traveler.color)}">
          </label>
          <button class="ledger-text-button" type="submit">完成</button>
          <button class="ledger-icon-button ledger-danger-button" type="button" data-ledger-action="delete-member" data-ledger-id="${escapeAttribute(traveler.id)}" aria-label="删除 ${escapeAttribute(traveler.name)}">删除</button>
        </form>`;
    }
    return `
      <div class="ledger-member-edit-row ledger-member-edit-row-static">
        ${renderAvatar(traveler)}
        <strong>${escapeHtml(traveler.name)}</strong>
        <span class="ledger-member-edit-actions">
          <button class="ledger-text-button" type="button" data-ledger-action="edit-member" data-ledger-id="${escapeAttribute(traveler.id)}">编辑</button>
          <button class="ledger-icon-button ledger-danger-button" type="button" data-ledger-action="delete-member" data-ledger-id="${escapeAttribute(traveler.id)}" aria-label="删除 ${escapeAttribute(traveler.name)}">删除</button>
        </span>
      </div>`;
  }

  function renderMembersDialog() {
    const suggestedColor = nextAvatarColor(ledgerData.travelers);
    return `
      <dialog class="ledger-dialog ledger-members-dialog" data-ledger-dialog="members" aria-labelledby="ledger-members-dialog-title">
        <div class="ledger-dialog-header">
          <div>
            <p class="ledger-section-kicker">同行人</p>
            <h2 id="ledger-members-dialog-title">管理本次成员</h2>
          </div>
          <button class="ledger-dialog-close" type="button" data-ledger-action="back-to-settings" aria-label="返回设置">×</button>
        </div>
        <div class="ledger-dialog-body">
          ${ledgerData.travelers.length ? `
            <div class="ledger-member-edit-list">
              ${ledgerData.travelers.map(renderMemberEditRow).join("")}
            </div>` : `<p class="ledger-dialog-empty">还没有同行人。</p>`}
          <form class="ledger-add-member-form" data-ledger-form="member-add">
            <div class="ledger-add-member-preview" data-ledger-member-preview style="--ledger-avatar-color:${escapeAttribute(suggestedColor)}">?</div>
            <label class="ledger-field ledger-add-member-name">
              <span class="ledger-field-label">添加成员</span>
              <input class="ledger-input" name="name" maxlength="30" placeholder="输入姓名" autocomplete="off" required>
            </label>
            <label class="ledger-color-picker" title="选择头像颜色">
              <span class="ledger-visually-hidden">头像颜色</span>
              <input type="color" name="color" value="${escapeAttribute(suggestedColor)}">
            </label>
            <button class="ledger-secondary-button" type="submit">添加</button>
          </form>
          <p class="ledger-dialog-note">头像文字会从姓名自动提取；颜色可以随时修改。</p>
        </div>
      </dialog>`;
  }

  function renderCurrencyChip(code) {
    const currency = currencyByCode(code);
    return `
      <span class="ledger-currency-chip">
        <b>${escapeHtml(code)}</b>
        <span>${escapeHtml(currency.nameZh)}</span>
        <button type="button" data-ledger-action="remove-common-currency" data-ledger-code="${escapeAttribute(code)}" aria-label="移除 ${escapeAttribute(currency.nameZh)}">×</button>
      </span>`;
  }

  function renderSettingsDialog() {
    const baseCurrency = currencyByCode(ledgerData.settings.baseCurrency);
    const baseLocked = ledgerData.bills.length > 0;
    return `
      <dialog class="ledger-dialog ledger-settings-dialog" data-ledger-dialog="settings" aria-labelledby="ledger-settings-dialog-title">
        <div class="ledger-dialog-header">
          <div>
            <h2 id="ledger-settings-dialog-title">记账设置</h2>
          </div>
          <button class="ledger-dialog-close" type="button" data-ledger-action="close-dialog" aria-label="关闭">×</button>
        </div>
        <div class="ledger-dialog-body">
          <section class="ledger-setting-group">
            <div class="ledger-setting-heading">
              <div><h3>同行人</h3><p>本次旅行共 ${ledgerData.travelers.length} 人</p></div>
              <button class="ledger-text-button" type="button" data-ledger-action="open-members">管理与添加</button>
            </div>
            <div class="ledger-settings-members">${ledgerData.travelers.length
              ? ledgerData.travelers.map((traveler) => `<span class="ledger-person-static">${renderAvatar(traveler)}<span>${escapeHtml(traveler.name)}</span></span>`).join("")
              : `<p class="ledger-dialog-empty">还没有同行人。</p>`}</div>
            <label class="ledger-self-setting"><span>本人</span><select class="ledger-input" data-ledger-self aria-label="本人">
              <option value="" ${ledgerData.settings.selfTravelerId ? "disabled" : "selected"}>请选择本人</option>
              ${ledgerData.travelers.map((traveler) => `<option value="${escapeAttribute(traveler.id)}" ${traveler.id === ledgerData.settings.selfTravelerId ? "selected" : ""}>${escapeHtml(traveler.name)}</option>`).join("")}
            </select></label>
            <p class="ledger-self-hint">个人花费只计本人承担的份额，替别人垫付不计入。</p>
          </section>
          <section class="ledger-setting-group">
            <div class="ledger-setting-heading">
              <div><h3>记账本位币</h3><p>统计与最终结算都使用这个币种</p></div>
            </div>
            <button class="ledger-currency-select-button" type="button" data-ledger-action="pick-base-currency" ${baseLocked ? "disabled" : ""}>
              <span class="ledger-currency-symbol">${escapeHtml(baseCurrency.symbol)}</span>
              <span><strong>${escapeHtml(baseCurrency.code)} · ${escapeHtml(baseCurrency.nameZh)}</strong></span>
              <span aria-hidden="true">›</span>
            </button>
            ${baseLocked ? `<p class="ledger-setting-note">已有账单后，本位币会锁定，避免历史换算金额失真。</p>` : ""}
          </section>
          <section class="ledger-setting-group">
            <div class="ledger-setting-heading">
              <div><h3>常用外币</h3><p>只在记账时显示你选中的币种</p></div>
              <button class="ledger-text-button" type="button" data-ledger-action="pick-common-currency">添加货币</button>
            </div>
            ${ledgerData.settings.commonCurrencies.length
              ? `<div class="ledger-currency-chips">${ledgerData.settings.commonCurrencies.map(renderCurrencyChip).join("")}</div>`
              : `<p class="ledger-dialog-empty">尚未添加常用外币。</p>`}
          </section>
          <section class="ledger-setting-group">
            <div class="ledger-setting-heading"><div><h3>统一换算汇率</h3><p>新账单按此汇率换算，历史金额保持原值。</p></div></div>
            <form data-ledger-form="rates" class="ledger-rates-form">
              ${ledgerData.settings.commonCurrencies.map((code) => `<label>1 ${escapeHtml(code)} = <input class="ledger-input" name="rate-${escapeAttribute(code)}" type="number" min="0.000001" max="1000000" step="any" inputmode="decimal" value="${escapeAttribute(ledgerData.settings.exchangeRates?.[code] || "")}" placeholder="待设置"> ${escapeHtml(ledgerData.settings.baseCurrency)}</label>`).join("")}
              <button class="ledger-primary-button" type="submit">保存统一汇率</button>
            </form>
          </section>
        </div>
      </dialog>`;
  }

  function searchedCurrencies() {
    const query = normalizeSearch(currencyQuery);
    if (!query) return [];
    return CURRENCY_CATALOG
      .filter((currency) => currencySearchText.get(currency.code).includes(query))
      .slice(0, 24);
  }

  function currencyResultMarkup(currency) {
    const isBase = currency.code === ledgerData.settings.baseCurrency;
    const isSelected = currencyPickerMode === "base"
      ? isBase
      : ledgerData.settings.commonCurrencies.includes(currency.code);
    const disabled = currencyPickerMode === "common" && isBase;
    return `
      <button class="ledger-currency-result ${isSelected ? "ledger-is-selected" : ""}" type="button" data-ledger-action="choose-currency" data-ledger-code="${escapeAttribute(currency.code)}" ${disabled ? "disabled" : ""}>
        <span class="ledger-currency-symbol">${escapeHtml(currency.symbol)}</span>
        <span class="ledger-currency-result-name"><strong>${escapeHtml(currency.code)} · ${escapeHtml(currency.nameZh)}</strong><small>${escapeHtml(currency.nameEn)}</small></span>
        <span class="ledger-currency-result-state">${disabled ? "本位币" : isSelected ? "已选择" : "选择"}</span>
      </button>`;
  }

  function renderCurrencyResultsMarkup() {
    const currencies = searchedCurrencies();
    if (!normalizeSearch(currencyQuery)) {
      return `<div class="ledger-currency-empty"><p>输入货币名称开始查找</p><small>例如：港币、Hong Kong 或 HKD</small></div>`;
    }
    return currencies.length
      ? currencies.map(currencyResultMarkup).join("")
      : `<div class="ledger-currency-empty"><p>没有找到相关货币</p><small>可以尝试中文名、英文名、代码、符号或国家与地区。</small></div>`;
  }

  function renderCurrencyDialog() {
    return `
      <dialog class="ledger-dialog ledger-currency-dialog" data-ledger-dialog="currency" aria-labelledby="ledger-currency-dialog-title">
        <div class="ledger-dialog-header">
          <div>
            <p class="ledger-section-kicker">世界货币</p>
            <h2 id="ledger-currency-dialog-title">${currencyPickerMode === "base" ? "选择本位币" : "添加常用外币"}</h2>
          </div>
          <button class="ledger-dialog-close" type="button" data-ledger-action="back-to-settings" aria-label="返回设置">×</button>
        </div>
        <div class="ledger-dialog-body">
          <label class="ledger-currency-search">
            <span class="ledger-visually-hidden">搜索货币</span>
            <span aria-hidden="true">⌕</span>
            <input class="ledger-input" type="search" data-ledger-currency-search placeholder="搜索港币、Hong Kong、HKD…" value="${escapeAttribute(currencyQuery)}" autocomplete="off">
          </label>
          <p class="ledger-search-help">支持中文名、英文名、代码、符号和国家或地区</p>
          <div class="ledger-currency-results" data-ledger-currency-results>${renderCurrencyResultsMarkup()}</div>
        </div>
      </dialog>`;
  }

  function renderApp() {
    if (!ledgerRoot || !ledgerData) return;
    ledgerRoot.innerHTML = `
      <div class="ledger-app" data-ledger-trip-id="${escapeAttribute(ledgerTripId)}">
        <div class="ledger-controls">
        <header class="ledger-page-header">
          <h1>旅行记账</h1>
          <div class="ledger-header-actions">
            <button class="ledger-icon-button" type="button" data-ledger-action="open-settings" aria-label="记账设置" title="记账设置"><span class="ledger-settings-label">设置</span><svg class="ledger-settings-glyph" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M9.67 4.14a2.34 2.34 0 0 1 4.66 0 2.34 2.34 0 0 0 3.32 1.92 2.34 2.34 0 0 1 2.33 4.03 2.34 2.34 0 0 0 0 3.82 2.34 2.34 0 0 1-2.33 4.03 2.34 2.34 0 0 0-3.32 1.92 2.34 2.34 0 0 1-4.66 0 2.34 2.34 0 0 0-3.32-1.92 2.34 2.34 0 0 1-2.33-4.03 2.34 2.34 0 0 0 0-3.82 2.34 2.34 0 0 1 2.33-4.03 2.34 2.34 0 0 0 3.32-1.92"/><circle cx="12" cy="12" r="3"/></svg></button>
          </div>
        </header>
        <nav class="ledger-tabs" role="tablist" aria-label="记账页面">
          <button id="ledger-entry-tab" class="ledger-tab ${activeTab === "entry" ? "ledger-is-active" : ""}" type="button" role="tab" aria-selected="${activeTab === "entry"}" data-ledger-action="set-tab" data-ledger-tab="entry">记账</button>
          <button id="ledger-stats-tab" class="ledger-tab ${activeTab === "stats" ? "ledger-is-active" : ""}" type="button" role="tab" aria-selected="${activeTab === "stats"}" data-ledger-action="set-tab" data-ledger-tab="stats">账单结算</button>
        </nav>
        </div>
        <div class="ledger-live" role="status" aria-live="polite">${escapeHtml(notice)}</div>
        ${renderEntryPage()}
        ${renderStatsPage()}
        ${renderMembersDialog()}
        ${renderSettingsDialog()}
        ${renderCurrencyDialog()}
      </div>`;
    const billForm = ledgerRoot.querySelector('[data-ledger-form="bill"]');
    if (billForm) syncConvertedAmount(billForm);
    syncSplitSummary();
    attachDialogBehavior();
    if (openDialogName) {
      const dialog = ledgerRoot.querySelector(`[data-ledger-dialog="${openDialogName}"]`);
      if (dialog) {
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
        if (openDialogName === "currency") {
          const search = dialog.querySelector("[data-ledger-currency-search]");
          if (search) {
            search.focus({ preventScroll: true });
            search.setSelectionRange(search.value.length, search.value.length);
          }
        }
      }
    }
  }

  function setNotice(message) {
    notice = message;
    const live = ledgerRoot?.querySelector(".ledger-live");
    if (live) live.textContent = message;
  }

  function setFormError(form, message) {
    const target = form.querySelector("[data-ledger-form-error]");
    if (target) target.textContent = message;
    const live = ledgerRoot?.querySelector(".ledger-live");
    if (live) live.textContent = message;
  }

  function enqueueMutation(operation) {
    const queued = mutationQueue.then(operation, operation);
    mutationQueue = queued.catch(() => {});
    return queued;
  }

  async function mutateData(mutator, options = {}) {
    return enqueueMutation(async () => {
      const next = deepClone(ledgerData);
      mutator(next);
      next.version = STORAGE_VERSION;
      next.updatedAt = new Date().toISOString();
      try {
        await Promise.resolve(ledgerAdapter.save(next, { tripId: ledgerTripId }));
        ledgerData = normalizeData(next);
        if (typeof options.afterSuccess === "function") options.afterSuccess();
        notice = options.message || "";
        renderApp();
        ledgerRoot.dispatchEvent(new CustomEvent("travel-ledger:changed", {
          bubbles: true,
          detail: { tripId: ledgerTripId, reason: options.reason || "update", data: deepClone(ledgerData) }
        }));
        return true;
      } catch (error) {
        console.error("TravelLedger could not save data", error);
        setNotice(ledgerPersistenceMode === "d1"
          ? "保存失败，请检查网络或你的云端数据库配置后重试。"
          : (error.message || "本地保存失败") + "，请检查存储或刷新后重试。");
        return false;
      }
    });
  }

  function captureBillDraft() {
    if (!ledgerRoot || editingBillId) return;
    const form = ledgerRoot.querySelector('[data-ledger-form="bill"]');
    if (!form) return;
    const formData = new FormData(form);
    billDraft = {
      currency: String(formData.get("currency") || ledgerData.settings.lastCurrency),
      originalAmount: String(formData.get("originalAmount") || ""),
      baseAmount: String(formData.get("baseAmount") || ""),
      category: String(formData.get("category") || "餐饮"),
      note: String(formData.get("note") || "").trim().slice(0, 160),
      orderedAt: String(formData.get("orderedAt") || ""),
      payerId: String(formData.get("payerId") || ""),
      participantIds: formData.getAll("participantIds").map(String)
      ,splitMode: String(formData.get("splitMode") || "equal"),
      sharesCents: Object.fromEntries(ledgerData.travelers.map((person) => [person.id, toCents(formData.get(`share-${person.id}`))]))
    };
  }

  function syncSplitSummary() {
    if (!ledgerRoot || !ledgerData) return;
    const form = ledgerRoot.querySelector('[data-ledger-form="bill"]');
    const summary = form?.querySelector("[data-ledger-split-summary]");
    if (!form || !summary) return;
    const participants = [...form.querySelectorAll('input[name="participantIds"]:checked')];
    if (!participants.length) {
      summary.textContent = "请选择至少一位分账人";
      return;
    }
    const currency = form.elements.currency?.value || ledgerData.settings.baseCurrency;
    const amountField = currency === ledgerData.settings.baseCurrency ? form.elements.originalAmount : form.elements.baseAmount;
    const amountCents = toCents(amountField?.value);
    const custom = form.elements.splitMode?.value === "custom";
    const shares = form.querySelector("[data-ledger-custom-shares]");
    if (shares) shares.hidden = !custom;
    form.querySelectorAll("[data-ledger-share-row]").forEach((row) => { row.hidden = !custom || !participants.some((input) => input.value === row.dataset.ledgerShareRow); });
    if (custom) {
      const total = participants.reduce((sum, input) => sum + (toCents(form.elements[`share-${input.value}`]?.value) || 0), 0);
      summary.textContent = `自定义已分配 ${formatMoney(total, ledgerData.settings.baseCurrency)}${amountCents ? ` / ${formatMoney(amountCents, ledgerData.settings.baseCurrency)}` : ""}`;
      return;
    }
    if (!amountCents || amountCents <= 0) {
      summary.textContent = `已选 ${participants.length} 人 · 按人数平分`;
      return;
    }
    const averageCents = Math.floor(amountCents / participants.length);
    summary.textContent = `已选 ${participants.length} 人 · 每人约 ${formatMoney(averageCents, ledgerData.settings.baseCurrency)}`;
  }

  function syncCurrencyField(select) {
    const form = select.closest("form");
    if (!form) return;
    const convertedField = form.querySelector("[data-ledger-converted-field]");
    const convertedInput = form.querySelector('[data-ledger-field="base-amount"]');
    const isForeign = select.value !== ledgerData.settings.baseCurrency;
    if (convertedField) convertedField.hidden = !isForeign;
    if (convertedInput && !isForeign) convertedInput.value = "";
    syncConvertedAmount(form);
    captureBillDraft();
    syncSplitSummary();
  }

  function syncConvertedAmount(form) {
    const code = form.elements.currency?.value;
    const rate = Number(ledgerData.settings.exchangeRates?.[code]) || 0;
    const original = toCents(form.elements.originalAmount?.value, code);
    const input = form.elements.baseAmount;
    if (input && code !== ledgerData.settings.baseCurrency) {
      const converted = original && rate ? Math.round(toBaseMinor(original, code, rate)) : 0;
      input.value = converted > 0 ? centsToInput(converted) : "";
      const help = form.querySelector("[data-ledger-rate-help]");
      if (help) help.textContent = rate ? `统一汇率：1 ${code} = ${rate} ${ledgerData.settings.baseCurrency}` : "请先到右上角「设置」填写统一汇率";
      const compact = form.querySelector('[data-ledger-converted-compact]');
      if (compact) compact.textContent = rate ? `约 ${converted > 0 ? formatMoney(converted, ledgerData.settings.baseCurrency) : '—'} · 汇率 ${rate}` : '请先在设置中填写汇率';
    }
  }

  async function compressReceipt(file) {
    if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("请上传 JPG、PNG 或 WebP 图片。");
    if (file.size > 15 * 1024 * 1024) throw new Error("照片过大，请选择小于 15 MB 的图片。");
    const url = URL.createObjectURL(file);
    try {
      const photo = new Image();
      photo.src = url;
      await photo.decode();
      let scale = Math.min(1, 1600 / Math.max(photo.naturalWidth, photo.naturalHeight));
      const canvas = document.createElement("canvas");
      const context = canvas.getContext("2d");
      if (!context) throw new Error("无法处理照片，请换一张试试。");
      for (let attempt = 0; attempt < 5; attempt++) {
        canvas.width = Math.max(1, Math.round(photo.naturalWidth * scale));
        canvas.height = Math.max(1, Math.round(photo.naturalHeight * scale));
        context.fillStyle = "#fff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.drawImage(photo, 0, 0, canvas.width, canvas.height);
        const data = canvas.toDataURL("image/jpeg", Math.max(.48, .82 - attempt * .09));
        if (data.length < 360000) return data;
        scale *= .78;
      }
      throw new Error("照片压缩后仍过大，请裁剪后再上传。");
    } finally { URL.revokeObjectURL(url); }
  }

  function syncMemberPreview(form) {
    const preview = form.querySelector("[data-ledger-member-preview]");
    if (!preview) return;
    const name = form.elements.name?.value || "";
    const color = form.elements.color?.value || nextAvatarColor(ledgerData.travelers);
    preview.textContent = name.trim() ? avatarInitial(name) : "?";
    if (isValidColor(color)) preview.style.setProperty("--ledger-avatar-color", color);
  }

  function attachDialogBehavior() {
    ledgerRoot.querySelectorAll("dialog[data-ledger-dialog]").forEach((dialog) => {
      dialog.addEventListener("close", () => {
        if (dialog.dataset.ledgerDialog === "members") editingMemberId = null;
        if (openDialogName === dialog.dataset.ledgerDialog) openDialogName = null;
      });
      dialog.addEventListener("cancel", () => {
        openDialogName = null;
      });
      dialog.addEventListener("click", (event) => {
        if (event.target === dialog) closeDialog(dialog);
      });
    });
  }

  function showDialog(name, { focusSearch = false } = {}) {
    if (!ledgerRoot) return;
    const dialog = ledgerRoot.querySelector(`[data-ledger-dialog="${name}"]`);
    if (!dialog) return;
    const current = ledgerRoot.querySelector("dialog[open]");
    if (current && current !== dialog) {
      openDialogName = null;
      if (typeof current.close === "function") current.close();
      else current.removeAttribute("open");
    }
    openDialogName = name;
    if (!dialog.open) {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    }
    const focusTarget = focusSearch
      ? dialog.querySelector("[data-ledger-currency-search]")
      : dialog.querySelector("input:not([type=color]), button");
    requestAnimationFrame(() => focusTarget?.focus({ preventScroll: true }));
  }

  function closeDialog(dialog = ledgerRoot?.querySelector("dialog[open]")) {
    if (!dialog) {
      openDialogName = null;
      return;
    }
    if (dialog.dataset.ledgerDialog === "members") editingMemberId = null;
    openDialogName = null;
    if (typeof dialog.close === "function") dialog.close();
    else dialog.removeAttribute("open");
  }

  function updateCurrencyDialog(mode) {
    currencyPickerMode = mode;
    currencyQuery = "";
    const dialog = ledgerRoot.querySelector('[data-ledger-dialog="currency"]');
    if (!dialog) return;
    const title = dialog.querySelector("#ledger-currency-dialog-title");
    const search = dialog.querySelector("[data-ledger-currency-search]");
    const results = dialog.querySelector("[data-ledger-currency-results]");
    if (title) title.textContent = mode === "base" ? "选择本位币" : "添加常用外币";
    if (search) search.value = "";
    if (results) results.innerHTML = renderCurrencyResultsMarkup();
    showDialog("currency", { focusSearch: true });
  }

  function chooseBillCurrency(button) {
    const form = button.closest('[data-ledger-form="bill"]');
    const code = button.dataset.ledgerCode || "";
    if (!form || !availableCurrencyCodes(code).includes(code)) return;
    const field = form.querySelector('[data-ledger-field="currency"]');
    const display = form.querySelector("[data-ledger-currency-display]");
    const dropdown = button.closest("details");
    if (field) field.value = code;
    if (display) display.textContent = `${code} · ${currencyByCode(code).nameZh}`;
    dropdown?.removeAttribute("open");
    if (field) syncCurrencyField(field);
  }

  function isDuplicateTravelerName(name, ignoredId = "") {
    const normalized = name.trim().toLocaleLowerCase();
    return ledgerData.travelers.some((traveler) => (
      traveler.id !== ignoredId && traveler.name.trim().toLocaleLowerCase() === normalized
    ));
  }

  async function submitBill(form) {
    const formData = new FormData(form);
    const currency = String(formData.get("currency") || "").toUpperCase();
    const originalAmountCents = toCents(formData.get("originalAmount"), currency);
    const isForeign = currency !== ledgerData.settings.baseCurrency;
    const rate = Number(ledgerData.settings.exchangeRates?.[currency]) || 0;
    const baseAmountCents = isForeign && rate ? Math.round(toBaseMinor(originalAmountCents, currency, rate)) : originalAmountCents;
    const category = String(formData.get("category") || "");
    const payerId = String(formData.get("payerId") || "");
    const participantIds = [...new Set(formData.getAll("participantIds").map(String))]
      .filter((id) => travelerById(id));
    const note = String(formData.get("note") || "").trim().slice(0, 160);
    const splitMode = formData.get("splitMode") === "custom" ? "custom" : "equal";
    const sharesCents = Object.fromEntries(participantIds.map((id) => [id, toCents(formData.get(`share-${id}`))]));

    if (!availableCurrencyCodes(currency).includes(currency)) {
      setFormError(form, "请选择本次旅程使用的币种。");
      return;
    }
    if (!originalAmountCents || originalAmountCents <= 0) {
      setFormError(form, "请输入大于零且符合该币种小数位数的金额。");
      form.elements.originalAmount?.focus();
      return;
    }
    if (isForeign && !rate) {
      setFormError(form, `请先在记账设置里填写 ${currency} 的统一汇率。`);
      return;
    }
    if (!baseAmountCents || baseAmountCents <= 0) {
      setFormError(form, "折算金额过小，请核对汇率与金额。");
      return;
    }
    if (!note) { setFormError(form, "请填写备注，方便之后对账。"); form.elements.note?.focus(); return; }
    if (!formData.get("orderedAt")) { setFormError(form, "请选择下单时间。"); form.elements.orderedAt?.focus(); return; }
    if (!CATEGORIES.includes(category)) {
      setFormError(form, "请选择账单分类。");
      return;
    }
    if (!travelerById(payerId)) {
      setFormError(form, "请选择一位买单人。");
      return;
    }
    if (!participantIds.length) {
      setFormError(form, "请选择至少一位参与分账的人。");
      return;
    }
    if (splitMode === "custom" && (participantIds.some((id) => sharesCents[id] === null)
      || participantIds.reduce((sum, id) => sum + sharesCents[id], 0) !== baseAmountCents)) {
      setFormError(form, "自定义分摊合计必须等于折算后的账单金额。");
      return;
    }

    const now = new Date().toISOString();
    const fields = {
      originalAmountCents,
      baseAmountCents,
      currency,
      category,
      note,
      orderedAt: String(formData.get("orderedAt") || ""),
      payerId,
      participantIds,
      splitMode,
      sharesCents: splitMode === "custom" ? sharesCents : {},
      exchangeRate: isForeign ? rate : null,
      receiptDataUrl: receiptRemoved ? "" : receiptDraft || ledgerData.bills.find((bill) => bill.id === editingBillId)?.receiptDataUrl || "",
      updatedAt: now
    };
    const billBeingEdited = ledgerData.bills.find((bill) => bill.id === editingBillId);
    await mutateData((next) => {
      if (billBeingEdited) {
        const index = next.bills.findIndex((bill) => bill.id === billBeingEdited.id);
        if (index >= 0) next.bills[index] = { ...next.bills[index], ...fields };
      } else {
        next.bills.push({ id: makeId("bill"), ...fields, createdAt: now });
        next.settings.lastCurrency = currency;
      }
    }, {
      reason: billBeingEdited ? "bill-updated" : "bill-added",
      message: billBeingEdited ? "账单已更新" : "账单已保存",
      afterSuccess() {
        editingBillId = null;
        billDraft = null;
        receiptDraft = "";
        receiptRemoved = false;
      }
    });
  }

  async function submitMemberAdd(form) {
    const name = String(new FormData(form).get("name") || "").trim();
    const color = String(new FormData(form).get("color") || "").toUpperCase();
    if (!name) {
      form.elements.name?.focus();
      setNotice("请输入同行人的姓名。");
      return;
    }
    if (isDuplicateTravelerName(name)) {
      form.elements.name?.focus();
      setNotice("这位同行人已经添加过了。");
      return;
    }
    const id = makeId("person");
    const traveler = {
      id,
      name: name.slice(0, 30),
      initial: avatarInitial(name),
      color: isValidColor(color) ? color : nextAvatarColor(ledgerData.travelers)
    };
    captureBillDraft();
    if (billDraft) billDraft.participantIds = [...new Set([...billDraft.participantIds, id])];
    openDialogName = "members";
    await mutateData((next) => next.travelers.push(traveler), {
      reason: "member-added",
      message: `${traveler.name}已加入同行人`
    });
  }

  async function submitBillNote(form) {
    const id = form.dataset.ledgerId || "";
    const bill = ledgerData.bills.find((entry) => entry.id === id);
    if (!bill) return false;
    const note = String(new FormData(form).get("note") || "").trim().slice(0, 160);
    if (!note) { form.querySelector("input[name=note]")?.focus(); setNotice("备注为必填项。"); return false; }
    if (note === (bill.note || "")) {
      if (editingNoteBillId === id) editingNoteBillId = null;
      replaceBillNoteControl(id, false);
      return true;
    }
    if (pendingNoteSave) return pendingNoteSave;
    form.classList.add("ledger-is-saving");
    for (const control of form.elements) control.disabled = true;
    const operation = enqueueMutation(async () => {
      try {
        const latestBill = ledgerData.bills.find((entry) => entry.id === id);
        if (!latestBill) return false;
        if (note === (latestBill.note || "")) {
          if (editingNoteBillId === id) editingNoteBillId = null;
          replaceBillNoteControl(id, false);
          return true;
        }
        const now = new Date().toISOString();
        const next = deepClone(ledgerData);
        const target = next.bills.find((entry) => entry.id === id);
        if (!target) return false;
        target.note = note;
        target.updatedAt = now;
        next.version = STORAGE_VERSION;
        next.updatedAt = now;
        await Promise.resolve(ledgerAdapter.save(next, { tripId: ledgerTripId }));
        ledgerData = normalizeData(next);
        if (editingNoteBillId === id) editingNoteBillId = null;
        const fullBillNote = editingBillId === id
          ? ledgerRoot.querySelector('[data-ledger-form="bill"] input[name="note"]')
          : null;
        if (fullBillNote) fullBillNote.value = note;
        replaceBillNoteControl(id, false);
        setNotice(note ? "备注已更新" : "备注已清空");
        ledgerRoot.dispatchEvent(new CustomEvent("travel-ledger:changed", {
          bubbles: true,
          detail: { tripId: ledgerTripId, reason: "bill-note-updated", data: deepClone(ledgerData) }
        }));
        return true;
      } catch (error) {
        console.error("TravelLedger could not save note", error);
        form.classList.remove("ledger-is-saving");
        for (const control of form.elements) control.disabled = false;
        setNotice(ledgerPersistenceMode === "d1"
          ? "备注保存失败，请检查网络或你的云端数据库配置后重试。"
          : "备注本地保存失败，请检查浏览器存储空间或隐私设置后重试。");
        return false;
      }
    });
    pendingNoteSave = operation;
    operation.then(
      () => { if (pendingNoteSave === operation) pendingNoteSave = null; },
      () => { if (pendingNoteSave === operation) pendingNoteSave = null; }
    );
    return operation;
  }

  async function submitMemberEdit(form) {
    const id = form.dataset.ledgerId || "";
    const formData = new FormData(form);
    const name = String(formData.get("name") || "").trim();
    const color = String(formData.get("color") || "").toUpperCase();
    if (!name) {
      form.elements.name?.focus();
      setNotice("姓名不能为空。");
      return;
    }
    if (isDuplicateTravelerName(name, id)) {
      form.elements.name?.focus();
      setNotice("已有同名的同行人，请换一个称呼。");
      return;
    }
    captureBillDraft();
    openDialogName = "members";
    await mutateData((next) => {
      const traveler = next.travelers.find((entry) => entry.id === id);
      if (!traveler) return;
      traveler.name = name.slice(0, 30);
      traveler.initial = avatarInitial(name);
      if (isValidColor(color)) traveler.color = color;
    }, { reason: "member-updated", message: "同行人信息已更新", afterSuccess() { editingMemberId = null; } });
  }

  function confirmLedgerAction(message) {
    return new Promise((resolve) => {
      const dialog = document.createElement("dialog");
      dialog.className = "ledger-confirm-dialog";
      dialog.setAttribute("aria-modal", "true");
      dialog.setAttribute("aria-label", "确认删除");
      dialog.innerHTML = `<div class="ledger-confirm-card">
        <p>${escapeHtml(message)}</p>
        <div class="ledger-confirm-actions">
          <button type="button" data-ledger-confirm="cancel">取消</button>
          <button type="button" class="ledger-confirm-danger" data-ledger-confirm="confirm">确认删除</button>
        </div>
      </div>`;
      let settled = false;
      const finish = (confirmed) => {
        if (settled) return;
        settled = true;
        if (dialog.open && typeof dialog.close === "function") dialog.close();
        dialog.remove();
        resolve(confirmed);
      };
      dialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        finish(false);
      });
      dialog.addEventListener("click", (event) => {
        const choice = event.target.closest("[data-ledger-confirm]");
        if (choice) finish(choice.dataset.ledgerConfirm === "confirm");
        else if (event.target === dialog) finish(false);
      });
      document.body.append(dialog);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      requestAnimationFrame(() => dialog.querySelector('[data-ledger-confirm="cancel"]')?.focus());
    });
  }

  async function deleteMember(id) {
    const traveler = travelerById(id);
    if (!traveler) return;
    const referenced = ledgerData.bills.some((bill) => (
      bill.payerId === id || bill.participantIds.includes(id)
    ));
    if (referenced) {
      setNotice(`${traveler.name}已有相关账单，需先处理这些账单后才能删除。`);
      return;
    }
    if (!await confirmLedgerAction(`删除同行人“${traveler.name}”？`)) return;
    captureBillDraft();
    if (billDraft) {
      billDraft.participantIds = billDraft.participantIds.filter((memberId) => memberId !== id);
      if (billDraft.payerId === id) billDraft.payerId = "";
    }
    editingMemberId = null;
    openDialogName = "members";
    await mutateData((next) => {
      next.travelers = next.travelers.filter((entry) => entry.id !== id);
    }, { reason: "member-deleted", message: `${traveler.name}已移除` });
  }

  async function deleteBill(id) {
    const bill = ledgerData.bills.find((entry) => entry.id === id);
    if (!bill || !await confirmLedgerAction("删除这笔账单？")) return;
    if (editingNoteBillId === id) editingNoteBillId = null;
    await mutateData((next) => {
      next.bills = next.bills.filter((entry) => entry.id !== id);
    }, { reason: "bill-deleted", message: "账单已删除" });
  }

  async function removeCommonCurrency(code) {
    if (!ledgerData.settings.commonCurrencies.includes(code)) return;
    captureBillDraft();
    openDialogName = "settings";
    await mutateData((next) => {
      next.settings.commonCurrencies = next.settings.commonCurrencies.filter((item) => item !== code);
      if (next.settings.lastCurrency === code) next.settings.lastCurrency = next.settings.baseCurrency;
    }, { reason: "currency-removed", message: `${currencyByCode(code).nameZh}已移除` });
  }

  async function chooseCurrency(code) {
    if (!CURRENCY_BY_CODE.has(code)) return;
    captureBillDraft();
    if (currencyPickerMode === "base") {
      if (ledgerData.bills.length) {
        setNotice("已有账单，本位币不能再修改。");
        return;
      }
      openDialogName = "settings";
      await mutateData((next) => {
        next.settings.baseCurrency = code;
        next.settings.commonCurrencies = next.settings.commonCurrencies.filter((item) => item !== code);
        next.settings.lastCurrency = code;
      }, { reason: "base-currency-changed", message: `本位币已设为${currencyByCode(code).nameZh}` });
      return;
    }

    const selected = ledgerData.settings.commonCurrencies.includes(code);
    openDialogName = "currency";
    await mutateData((next) => {
      next.settings.commonCurrencies = selected
        ? next.settings.commonCurrencies.filter((item) => item !== code)
        : [...next.settings.commonCurrencies, code];
      if (selected && next.settings.lastCurrency === code) next.settings.lastCurrency = next.settings.baseCurrency;
    }, {
      reason: selected ? "currency-removed" : "currency-added",
      message: selected ? `${currencyByCode(code).nameZh}已移除` : `${currencyByCode(code).nameZh}已加入常用外币`
    });
  }

  function editBill(id) {
    if (!ledgerData.bills.some((bill) => bill.id === id)) return;
    if (editingBillId && editingBillId !== id) {
      setNotice("请先保存或取消正在编辑的账单。");
      ledgerRoot.querySelector('[data-ledger-form="bill"] [data-ledger-field="original-amount"]')?.focus({ preventScroll: true });
      return;
    }
    captureBillDraft();
    editingBillId = id;
    receiptDraft = "";
    receiptRemoved = false;
    activeTab = "entry";
    notice = "";
    renderApp();
    requestAnimationFrame(() => {
      ledgerRoot.querySelector(".ledger-entry-card")?.scrollIntoView({ behavior: "smooth", block: "start" });
      ledgerRoot.querySelector('[data-ledger-field="original-amount"]')?.focus({ preventScroll: true });
    });
  }

  function handleAction(button) {
    const action = button.dataset.ledgerAction;
    if (!action) return;
    if (action === "toggle-bill-sort") {
      captureBillDraft();
      billSortOrder = billSortOrder === "asc" ? "desc" : "asc";
      renderApp();
    } else if (action === "set-tab") {
      captureBillDraft();
      setActiveTab(button.dataset.ledgerTab);
    } else if (action === "open-members") {
      captureBillDraft();
      showDialog("members");
    } else if (action === "open-settings") {
      captureBillDraft();
      showDialog("settings");
    } else if (action === "edit-member") {
      captureBillDraft();
      editingMemberId = button.dataset.ledgerId || null;
      openDialogName = "members";
      renderApp();
      requestAnimationFrame(() => ledgerRoot.querySelector('[data-ledger-form="member-edit"] input[name="name"]')?.focus());
    } else if (action === "close-dialog") {
      closeDialog(button.closest("dialog"));
    } else if (action === "back-to-settings") {
      closeDialog(button.closest("dialog"));
      showDialog("settings");
    } else if (action === "pick-base-currency") {
      updateCurrencyDialog("base");
    } else if (action === "pick-common-currency") {
      updateCurrencyDialog("common");
    } else if (action === "choose-bill-currency") {
      chooseBillCurrency(button);
    } else if (action === "choose-currency") {
      chooseCurrency(button.dataset.ledgerCode || "");
    } else if (action === "remove-common-currency") {
      removeCommonCurrency(button.dataset.ledgerCode || "");
    } else if (action === "delete-member") {
      deleteMember(button.dataset.ledgerId || "");
    } else if (action === "edit-bill") {
      editBill(button.dataset.ledgerId || "");
    } else if (action === "delete-bill") {
      deleteBill(button.dataset.ledgerId || "");
    } else if (action === "edit-bill-note") {
      void openBillNoteEditor(button.dataset.ledgerId || "");
    } else if (action === "cancel-note-edit") {
      cancelBillNoteEditor();
    } else if (action === "cancel-edit") {
      editingBillId = null;
      receiptDraft = "";
      receiptRemoved = false;
      renderApp();
    } else if (action === "remove-receipt") {
      receiptDraft = "";
      receiptRemoved = true;
      button.closest(".ledger-receipt-preview")?.remove();
    } else if (action === "select-all-participants") {
      const form = button.closest("form");
      const inputs = [...form.querySelectorAll('input[name="participantIds"]')];
      const shouldSelectAll = inputs.some((input) => !input.checked);
      inputs.forEach((input) => { input.checked = shouldSelectAll; });
      captureBillDraft();
      syncSplitSummary();
    }
  }

  async function handleRootClick(event) {
    const button = event.target.closest("[data-ledger-action]");
    if (!button || !ledgerRoot.contains(button)) return;
    event.preventDefault();
    const action = button.dataset.ledgerAction;
    const insideNoteForm = button.closest('[data-ledger-form="bill-note"]');
    if (editingNoteBillId
      && !insideNoteForm
      && action !== "edit-bill-note"
      && action !== "cancel-note-edit"
      && !(await flushActiveBillNote())) return;
    handleAction(button);
  }

  function handleRootInput(event) {
    if (event.target.matches("[data-ledger-currency-search]")) {
      currencyQuery = event.target.value;
      const results = ledgerRoot.querySelector("[data-ledger-currency-results]");
      if (results) results.innerHTML = renderCurrencyResultsMarkup();
      return;
    }
    const memberForm = event.target.closest('[data-ledger-form="member-add"]');
    if (memberForm) syncMemberPreview(memberForm);
    if (event.target.closest('[data-ledger-form="bill"]')) {
      if (event.target.name === "originalAmount") syncConvertedAmount(event.target.form);
      captureBillDraft();
      syncSplitSummary();
    }
  }

  async function handleRootChange(event) {
    if (event.target.matches("[data-ledger-self]")) {
      const input = event.target;
      const id = input.value;
      if (!travelerById(id)) return;
      const previous = ledgerData.settings.selfTravelerId;
      input.disabled = true;
      const saved = await mutateData((next) => { next.settings.selfTravelerId = id; },
        { reason: "self-traveler", message: "已更新本人，个人花费按本人承担的份额统计。" });
      if (!saved) { input.value = previous; input.disabled = false; }
      return;
    }
    if (event.target.matches('[data-ledger-field="currency"]')) syncCurrencyField(event.target);
    if (event.target.matches("[data-ledger-receipt]")) {
      const file = event.target.files?.[0];
      if (file) {
        try {
          receiptDraft = await compressReceipt(file);
          receiptRemoved = false;
          captureBillDraft();
          renderApp();
        } catch (error) { setNotice(error.message || "无法读取这张照片。"); }
      }
      return;
    }
    if (event.target.closest('[data-ledger-form="bill"]')) {
      captureBillDraft();
      syncSplitSummary();
    }
  }

  async function handleRootSubmit(event) {
    const form = event.target.closest("form[data-ledger-form]");
    if (!form || !ledgerRoot.contains(form)) return;
    event.preventDefault();
    if (form.dataset.ledgerForm === "bill-note") {
      await submitBillNote(form);
      return;
    }
    if (form.dataset.ledgerForm === "rates") {
      const data = new FormData(form);
      const rates = {};
      for (const code of ledgerData.settings.commonCurrencies) {
        const value = String(data.get(`rate-${code}`) || "").trim();
        if (!value) continue;
        const rate = Number(value);
        if (!Number.isFinite(rate) || rate <= 0 || rate > 1000000) {
          setNotice(`请检查 ${code} 的汇率。`);
          return;
        }
        rates[code] = rate;
      }
      openDialogName = "settings";
      await mutateData((next) => { next.settings.exchangeRates = rates; },
        { reason: "rates-updated", message: "统一汇率已保存在当前账本。" });
      return;
    }
    if (editingNoteBillId && !(await flushActiveBillNote())) return;
    if (form.dataset.ledgerForm === "bill") await submitBill(form);
    if (form.dataset.ledgerForm === "member-add") await submitMemberAdd(form);
    if (form.dataset.ledgerForm === "member-edit") await submitMemberEdit(form);
  }

  function handleRootKeydown(event) {
    if (event.key === "Escape" && event.target.closest('[data-ledger-form="bill-note"]')) {
      event.preventDefault();
      cancelBillNoteEditor();
      return;
    }
    if (!event.target.matches('[role="tab"]') || !["ArrowLeft", "ArrowRight"].includes(event.key)) return;
    event.preventDefault();
    const nextTab = event.target.dataset.ledgerTab === "entry" ? "stats" : "entry";
    setActiveTab(nextTab);
    requestAnimationFrame(() => ledgerRoot.querySelector(`[data-ledger-tab="${nextTab}"]`)?.focus());
  }

  function setActiveTab(tab, options = {}) {
    const nextTab = tab === "stats" ? "stats" : "entry";
    if (editingNoteBillId && !options.skipNoteFlush) {
      void flushActiveBillNote().then((saved) => {
        if (saved) setActiveTab(nextTab, { ...options, skipNoteFlush: true });
      });
      return;
    }
    const changed = activeTab !== nextTab;
    if (changed) captureBillDraft();
    activeTab = nextTab;
    if (ledgerData && (changed || options.forceRender)) renderApp();
    if (options.updateHash !== false && changed) {
      window.dispatchEvent(new CustomEvent("travel-ledger:navigate", { detail: { tab: nextTab } }));
    }
  }

  async function init(options = {}) {
    const requestedRoot = typeof options.root === "string"
      ? document.querySelector(options.root)
      : options.root || document.querySelector("#ledger-root");
    if (!requestedRoot) return null;
    if (initialized && requestedRoot === ledgerRoot) return deepClone(ledgerData);

    ledgerRoot = requestedRoot;
    ledgerRoot.setAttribute("aria-busy", "true");
    const [resolvedTripId, tripConfig] = await Promise.all([
      resolveTripId(ledgerRoot, options),
      resolveTripConfig(ledgerRoot, options)
    ]);
    ledgerTripId = resolvedTripId;
    const persistence = resolvePersistence(ledgerRoot, options, tripConfig);
    ledgerAdapter = options.repository || options.adapter || (persistence.mode === "d1"
      ? createD1Adapter(ledgerTripId, persistence.d1Options)
      : createLocalStorageAdapter(ledgerTripId, persistence.localOptions));
    ledgerPersistenceMode = options.repository || options.adapter
      ? String(ledgerAdapter.mode || "custom")
      : persistence.mode;
    let stored = null;
    try {
      stored = await Promise.resolve(ledgerAdapter.load({ tripId: ledgerTripId }));
    } catch (error) {
      console.error("TravelLedger could not load data", error);
      notice = ledgerPersistenceMode === "d1"
        ? "共享账本暂时无法读取，请检查你的 Cloudflare D1 配置。"
        : "本地账本读取失败。请检查浏览器存储后重试，旧数据不会被覆盖。";
    }
    if (notice && stored === null) { ledgerRoot.textContent = notice; ledgerRoot.removeAttribute("aria-busy"); return null; }
    ledgerData = normalizeData(stored);
    activeTab = location.hash === "#ledger-stats" ? "stats" : "entry";
    ledgerRoot.addEventListener("click", handleRootClick);
    ledgerRoot.addEventListener("input", handleRootInput);
    ledgerRoot.addEventListener("change", handleRootChange);
    ledgerRoot.addEventListener("submit", handleRootSubmit);
    ledgerRoot.addEventListener("keydown", handleRootKeydown);
    document.addEventListener("pointerdown", handleDocumentPointerDown);
    initialized = true;
    renderApp();
    ledgerRoot.removeAttribute("aria-busy");
    return deepClone(ledgerData);
  }

  const publicApi = {
    init,
    setActiveTab,
    calculateCurrencyTransfers,
    calculateCurrencySettlement,
    currencyDigits,
    toCents,
    createLocalStorageAdapter,
    createD1Adapter,
    getPersistenceMode() {
      return ledgerPersistenceMode;
    },
    getSnapshot() {
      return ledgerData ? deepClone(ledgerData) : null;
    }
  };
  if (typeof module === "object" && module.exports) module.exports = publicApi;
  if (typeof window === "undefined" || typeof document === "undefined") return;
  window.TravelLedger = publicApi;

  // The page controller initializes Ledger only when the module is enabled.
  // Standalone consumers can continue to call TravelLedger.init(options) explicitly.
})();

