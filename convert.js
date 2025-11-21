const NODE_SUFFIX = "节点";
const REGEX_LANDING = /家宽|家庭|家庭宽带|商宽|商业宽带|星链|Starlink|落地/i;
const REGEX_HIGH_SPEED = /高速专线|专线|GIA|CMI|9929|CN2/i;
const REGEX_LOW_COST = /0\.[0-5]|低倍率|省流|大流量|实验性/i;
const REGEX_SPECIAL_NODES = new RegExp([REGEX_LANDING, REGEX_HIGH_SPEED, REGEX_LOW_COST].map(r => r.source).join("|"), "i");

function isSpecialNode(name) {
    return REGEX_SPECIAL_NODES.test(name);
}

function parseBool(value) {
    if (typeof value === "boolean") return value;
    if (typeof value === "string") {
        return value.toLowerCase() === "true" || value === "1";
    }
    return false;
}

function parseNumber(value, defaultValue = 0) {
    if (value === null || typeof value === 'undefined') {
        return defaultValue;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
}

function buildFeatureFlags(args) {
    const spec = {
        loadbalance: "loadBalance",
        full: "fullConfig",
        keepalive: "keepAliveEnabled",
        fakeip: "fakeIPEnabled",
        quic: "quicEnabled",
    };
    const flags = Object.entries(spec).reduce((acc, [sourceKey, targetKey]) => {
        acc[targetKey] = parseBool(args[sourceKey]) || false;
        return acc;
    }, {});
    flags.countryThreshold = parseNumber(args.threshold, 0);
    flags.ipv6Enabled = true;
    flags.regionsEnabled = true;
    return flags;
}

const rawArgs = typeof $arguments !== 'undefined' ? $arguments : {};
const {
    loadBalance,
    fullConfig,
    keepAliveEnabled,
    fakeIPEnabled,
    quicEnabled,
    regionsEnabled,
    ipv6Enabled,
    countryThreshold
} = buildFeatureFlags(rawArgs);

function getCountryGroupNames(countryInfo, minCount) {
    return countryInfo.filter(item => item.count >= minCount).map(item => item.country + NODE_SUFFIX);
}

function stripNodeSuffix(groupNames) {
    const suffixPattern = new RegExp(`${NODE_SUFFIX}$`);
    return groupNames.map(name => name.replace(suffixPattern, ""));
}

const PROXY_GROUPS = {
    SELECT: "选择代理",
    AUTO_SELECT: "自动选择",
    MANUAL: "手动选择",
    FALLBACK: "故障转移",
    DIRECT: "直连",
    LANDING: "落地节点",
    LOW_COST: "低倍率节点",
    ULTRA_LOW_COST: "超低倍率节点",
    HIGH_SPEED: "高速专线",
};

const buildList = (...elements) => elements.flat().filter(Boolean);

function buildBaseLists({ landing, lowCost, highSpeed }) {
    const defaultSelector = buildList(
        PROXY_GROUPS.FALLBACK,
        landing && PROXY_GROUPS.LANDING,
        PROXY_GROUPS.AUTO_SELECT,
        highSpeed && PROXY_GROUPS.HIGH_SPEED,
        lowCost && PROXY_GROUPS.LOW_COST,
        PROXY_GROUPS.MANUAL,
        PROXY_GROUPS.DIRECT
    );
    const defaultProxies = buildList(
        PROXY_GROUPS.SELECT,
        PROXY_GROUPS.AUTO_SELECT,
        highSpeed && PROXY_GROUPS.HIGH_SPEED,
        lowCost && PROXY_GROUPS.LOW_COST,
        PROXY_GROUPS.MANUAL,
        PROXY_GROUPS.DIRECT
    );
    const defaultProxiesDirect = buildList(
        PROXY_GROUPS.DIRECT,
        PROXY_GROUPS.AUTO_SELECT,
        highSpeed && PROXY_GROUPS.HIGH_SPEED,
        lowCost && PROXY_GROUPS.LOW_COST,
        PROXY_GROUPS.SELECT,
        PROXY_GROUPS.MANUAL
    );
    const defaultFallback = buildList(
        lowCost && PROXY_GROUPS.LOW_COST,
        PROXY_GROUPS.AUTO_SELECT,
        PROXY_GROUPS.MANUAL,
        PROXY_GROUPS.DIRECT
    );
    return { defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback };
}

const ruleProviders = {
    "banAd_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/banAd_mini.mrs" },
    "private_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/private.mrs" },
    "bank_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-bank-cn.mrs" },
    "xiaomi_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/xiaomi.mrs" },
    "biliintl_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/bilibili%40!cn.mrs" },
    "bilibili_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/bilibili.mrs" },
    "bahamut_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/bahamut.mrs" },
    "spotify_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/spotify.mrs" },
    "steam_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/steam%40cn.mrs" },
    "steamcdn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/Steam-domain.mrs" },
    "steam_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/steam.mrs" },
    "ai!cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://github.com/MetaCubeX/meta-rules-dat/raw/refs/heads/meta/geo/geosite/category-ai-!cn.mrs" },
    "openai_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/openai.mrs" },
    "youtube_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/youtube.mrs" },
    "google_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/google.mrs" },
    "github_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/github.mrs" },
    "telegram_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/telegram.mrs" },
    "netflix_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/netflix.mrs" },
    "paypal_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/paypal.mrs" },
    "onedrive_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/onedrive.mrs" },
    "microsoft_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/microsoft.mrs" },
    "apple_firmware_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/applefirmware.mrs" },
    "apple_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/apple.mrs" },
    "speedtest_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/ookla-speedtest.mrs" },
    "tiktok_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/tiktok.mrs" },
    "gfw_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/gfw.mrs" },
    "geolocation-!cn": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/geolocation-!cn.mrs" },
    "cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geosite/cn.mrs" },
    "media_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-media-cn.mrs" },
    "media!cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-social-media-!cn.mrs" },
    "Cloudflare_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/cloudflare.mrs" },
    "gitbook_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/gitbook.mrs" },
    "disney_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/disney.mrs" },
    "hbo_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/hbo.mrs" },
    "primevideo_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/primevideo.mrs" },
    "NetEaseMusic_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/NetEaseMusic-domain.mrs" },
    "Amazon_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/amazon.mrs" },
    "Shopee_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/shopee.mrs" },
    "ebay_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/ebay.mrs" },
    "appleTV_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/appletv.mrs" },
    "Epic_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/epicgames.mrs" },
    "EA_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/ea.mrs" },
    "Blizzard_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/blizzard.mrs" },
    "UBI_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/ubi.mrs" },
    "Sony_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/sony.mrs" },
    "Nintendo_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/nintendo.mrs" },
    "facebook_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/facebook.mrs" },
    "whatsapp_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/whatsapp.mrs" },
    "instagram_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/instagram.mrs" },
    "threads_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/threads.mrs" },
    "meta_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/meta.mrs" },
    "Wise_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/wise.mrs" },
    "ifast_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/ifast.mrs" },
    "line_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/line.mrs" },
    "talkatone_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/Talkatone-domain.mrs" },
    "Shopify_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/shopify.mrs" },
    "signal_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/signal.mrs" },
    "wechat_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/WeChat.mrs" },
    "proxy_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/proxy.mrs" },
    "direct_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/direct.mrs" },
    "apple_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/apple%40cn.mrs" },
    "alibaba_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/alibaba.mrs" },
    "ai_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-ai-cn.mrs" },
    "discord_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/discord.mrs" },
    "fcm_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/googlefcm.mrs" },
    "emby_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/emby.mrs" },
    "pt_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-pt.mrs" },
    "public-tracker_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-public-tracker.mrs" },
    "115_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/115.mrs" },
    "aliyun_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/aliyun.mrs" },
    "twitch_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/twitch.mrs" },
    "porn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-porn.mrs" },
    "iptv_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/iptv.mrs" },
    "googlevpn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/googleVPN.mrs" },
    "ai_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/ai.mrs" },
    "TVB_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/tvb.mrs" },
    "game_cn_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geosite/category-games%40cn.mrs" },
    "fakeip_filter_domain": { "type": "http", "behavior": "domain", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/Domain/fakeip-filter.mrs" },
    "bilibili_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo-lite/geoip/bilibili.mrs" },
    "cn_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/cn.mrs" },
    "google_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/google.mrs" },
    "telegram_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/telegram.mrs" },
    "netflix_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/meta/geo/geoip/netflix.mrs" },
    "Amazon_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/amazon-ip.mrs" },
    "facebook_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geoip/facebook.mrs" },
    "twitter_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geoip/twitter.mrs" },
    "private_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/MetaCubeX/meta-rules-dat/refs/heads/meta/geo/geoip/private.mrs" },
    "talkatone_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/Talkatone-ip.mrs" },
    "steamcdn_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/steamCDN-ip.mrs" },
    "NetEaseMusic_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/NetEaseMusic-ip.mrs" },
    "emby_ip": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/emby-ip.mrs" },
    "google_asn_cn": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/AS24424.mrs" },
    "discord_asn": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/AS49544.mrs" },
    "wechat_asn": { "type": "http", "behavior": "ipcidr", "format": "mrs", "interval": 86400, "url": "https://raw.githubusercontent.com/Lanlan13-14/Rules/refs/heads/main/rules/IP/AS132203.mrs" }
};

const baseRules = [
    "RULE-SET,banAd_domain,广告拦截",
    `RULE-SET,wechat_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,wechat_asn,${PROXY_GROUPS.DIRECT},no-resolve`,
    "RULE-SET,speedtest_domain,科技服务",
    `RULE-SET,Cloudflare_domain,${PROXY_GROUPS.SELECT}`,
    "RULE-SET,Wise_domain,支付购物",
    "RULE-SET,paypal_domain,支付购物",
    `RULE-SET,proxy_domain,${PROXY_GROUPS.SELECT}`,
    "RULE-SET,ai!cn_domain,AI",
    "RULE-SET,ai_domain,AI",
    "RULE-SET,openai_domain,AI",
    "RULE-SET,biliintl_domain,流媒体",
    "RULE-SET,bilibili_domain,Bilibili",
    "RULE-SET,bilibili_ip,Bilibili,no-resolve",
    "RULE-SET,bahamut_domain,流媒体",
    `RULE-SET,bank_cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,ai_cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,direct_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,alibaba_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,115_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,aliyun_domain,${PROXY_GROUPS.DIRECT}`,
    "RULE-SET,github_domain,科技服务",
    "RULE-SET,gitbook_domain,科技服务",
    "RULE-SET,googlevpn_domain,科技服务",
    "RULE-SET,youtube_domain,YouTube",
    "RULE-SET,fcm_domain,科技服务",
    "RULE-SET,google_domain,科技服务",
    "RULE-SET,google_asn_cn,科技服务,no-resolve",
    "RULE-SET,google_ip,科技服务,no-resolve",
    "RULE-SET,onedrive_domain,科技服务",
    "RULE-SET,microsoft_domain,科技服务",
    "RULE-SET,telegram_domain,通讯社交",
    "RULE-SET,telegram_ip,通讯社交,no-resolve",
    "RULE-SET,line_domain,通讯社交",
    "RULE-SET,talkatone_domain,通讯社交",
    "RULE-SET,talkatone_ip,通讯社交,no-resolve",
    "RULE-SET,discord_domain,通讯社交",
    "RULE-SET,discord_asn,通讯社交,no-resolve",
    "RULE-SET,signal_domain,通讯社交",
    `RULE-SET,iptv_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,private_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,xiaomi_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,steam_cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,steamcdn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,steamcdn_ip,${PROXY_GROUPS.DIRECT},no-resolve`,
    `RULE-SET,NetEaseMusic_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,NetEaseMusic_ip,${PROXY_GROUPS.DIRECT},no-resolve`,
    `RULE-SET,pt_cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,public-tracker_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,media_cn_domain,${PROXY_GROUPS.DIRECT}`,
    "RULE-SET,appleTV_domain,流媒体",
    `RULE-SET,apple_cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,apple_firmware_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,apple_domain,${PROXY_GROUPS.DIRECT}`,
    "RULE-SET,tiktok_domain,流媒体",
    "RULE-SET,netflix_domain,流媒体",
    "RULE-SET,netflix_ip,流媒体,no-resolve",
    "RULE-SET,disney_domain,流媒体",
    "RULE-SET,hbo_domain,流媒体",
    "RULE-SET,primevideo_domain,流媒体",
    "RULE-SET,emby_domain,流媒体",
    "RULE-SET,emby_ip,流媒体,no-resolve",
    "RULE-SET,spotify_domain,流媒体",
    "RULE-SET,facebook_domain,通讯社交",
    "RULE-SET,whatsapp_domain,通讯社交",
    "RULE-SET,instagram_domain,通讯社交",
    "RULE-SET,threads_domain,通讯社交",
    "RULE-SET,meta_domain,通讯社交",
    "RULE-SET,facebook_ip,通讯社交,no-resolve",
    "RULE-SET,twitch_domain,流媒体",
    "RULE-SET,porn_domain,流媒体",
    "RULE-SET,TVB_domain,流媒体",
    "RULE-SET,media!cn_domain,流媒体",
    "RULE-SET,twitter_ip,通讯社交,no-resolve",
    "RULE-SET,steam_domain,游戏娱乐",
    "RULE-SET,Epic_domain,游戏娱乐",
    "RULE-SET,EA_domain,游戏娱乐",
    "RULE-SET,Blizzard_domain,游戏娱乐",
    "RULE-SET,UBI_domain,游戏娱乐",
    "RULE-SET,Sony_domain,游戏娱乐",
    "RULE-SET,Nintendo_domain,游戏娱乐",
    `RULE-SET,ifast_domain,${PROXY_GROUPS.DIRECT}`,
    "RULE-SET,Amazon_domain,支付购物",
    "RULE-SET,Amazon_ip,支付购物,no-resolve",
    "RULE-SET,Shopee_domain,支付购物",
    "RULE-SET,Shopify_domain,支付购物",
    "RULE-SET,ebay_domain,支付购物",
    `RULE-SET,gfw_domain,${PROXY_GROUPS.SELECT}`,
    `RULE-SET,geolocation-!cn,${PROXY_GROUPS.SELECT}`,
    `RULE-SET,cn_domain,${PROXY_GROUPS.DIRECT}`,
    `RULE-SET,private_ip,${PROXY_GROUPS.DIRECT},no-resolve`,
    `RULE-SET,cn_ip,${PROXY_GROUPS.DIRECT},no-resolve`,
    `MATCH,${PROXY_GROUPS.SELECT}`
];

function buildRules({ quicEnabled }) {
    const ruleList = [...baseRules];
    if (!quicEnabled) {
        ruleList.unshift("AND,((DST-PORT,443),(NETWORK,UDP)),REJECT");
    }
    return ruleList;
}

const snifferConfig = {
    "sniff": { "TLS": { "ports": [443, 8443] }, "HTTP": { "ports": [80, 8080, 8880] }, "QUIC": { "ports": [443, 8443] } },
    "override-destination": false,
    "enable": true,
    "force-dns-mapping": true,
    "skip-domain": ["Mijia Cloud", "dlg.io.mi.com", "+.push.apple.com"]
};

function buildDnsConfig({ mode, useFakeIpFilter }) {
    const domesticNS = ["https://doh.pub/dns-query", "https://223.5.5.5/dns-query#h3=true"];
    const foreignNS = ["https://dns.google/dns-query", "https://dns.cloudflare.com/dns-query"];
    const config = {
        "enable": true,
        "listen": ":1053",
        "ipv6": ipv6Enabled,
        "prefer-h3": false,
        "respect-rules": true,
        "enhanced-mode": mode,
        "fake-ip-range": "28.0.0.1/8",
        "fake-ip-filter-mode": "blacklist",
        "default-nameserver": ["119.29.29.29", "180.184.1.1"],
        "nameserver": foreignNS,
        "proxy-server-nameserver": domesticNS,
        "direct-nameserver": domesticNS
    };
    if (useFakeIpFilter) {
        config["fake-ip-filter"] = ["rule-set:fakeip_filter_domain,game_cn_domain,bank_cn_domain,wechat_domain,ai_cn_domain,NetEaseMusic_domain,fcm_domain,alibaba_domain,media_cn_domain,xiaomi_domain,steam_cn_domain,pt_cn_domain,public-tracker_domain,115_domain,aliyun_domain,direct_domain,apple_cn_domain,apple_firmware_domain,iptv_domain,private_domain,cn_domain"];
    }
    return config;
}

const dnsConfig = buildDnsConfig({ mode: "redir-host", useFakeIpFilter: false });
const dnsConfigFakeIp = buildDnsConfig({ mode: "fake-ip", useFakeIpFilter: true });

const geoxURL = {
    "geoip": "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geoip.dat",
    "geosite": "https://cdn.jsdelivr.net/gh/Loyalsoldier/v2ray-rules-dat@release/geosite.dat",
    "mmdb": "https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/Country.mmdb",
    "asn": "https://cdn.jsdelivr.net/gh/Loyalsoldier/geoip@release/GeoLite2-ASN.mmdb"
};

const countriesMeta = {
    "香港": { pattern: "(?i)香港|港|HK|hk|Hong Kong|HongKong|hongkong|🇭🇰", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Hong_Kong.png" },
    "澳门": { pattern: "(?i)澳门|MO|Macau|🇲🇴", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Macao.png" },
    "台湾": { pattern: "(?i)台|新北|彰化|TW|Taiwan|🇹🇼", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Taiwan.png" },
    "新加坡": { pattern: "(?i)新加坡|坡|狮城|SG|Singapore|🇸🇬", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Singapore.png" },
    "日本": { pattern: "(?i)日本|川日|东京|大阪|泉日|埼玉|沪日|深日|JP|Japan|🇯🇵", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Japan.png" },
    "韩国": { pattern: "(?i)KR|Korea|KOR|首尔|韩|韓|🇰🇷", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Korea.png" },
    "美国": { pattern: "(?i)美国|美|US|United States|🇺🇸", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_States.png" },
    "加拿大": { pattern: "(?i)加拿大|Canada|CA|🇨🇦", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Canada.png" },
    "英国": { pattern: "(?i)英国|United Kingdom|UK|伦敦|London|🇬🇧", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/United_Kingdom.png" },
    "澳大利亚": { pattern: "(?i)澳洲|澳大利亚|AU|Australia|🇦🇺", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Australia.png" },
    "德国": { pattern: "(?i)德国|德|DE|Germany|🇩🇪", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Germany.png" },
    "法国": { pattern: "(?i)法国|法|FR|France|🇫🇷", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/France.png" },
    "俄罗斯": { pattern: "(?i)俄罗斯|俄|RU|Russia|🇷🇺", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Russia.png" },
    "泰国": { pattern: "(?i)泰国|泰|TH|Thailand|🇹🇭", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Thailand.png" },
    "印度": { pattern: "(?i)印度|IN|India|🇮🇳", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/India.png" },
    "马来西亚": { pattern: "(?i)马来西亚|马来|MY|Malaysia|🇲🇾", icon: "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Malaysia.png" },
};

function hasLowCost(config) {
    return (config.proxies || []).some(proxy => /0\.1/i.test(proxy.name));
}

function hasUltraLowCost(config) {
    return (config.proxies || []).some(proxy => /0\.01/i.test(proxy.name));
}

function hasHighSpeedNodes(config) {
    return (config.proxies || []).some(proxy => REGEX_HIGH_SPEED.test(proxy.name));
}

function hasLandingNodes(config) {
    return (config.proxies || []).some(proxy => REGEX_LANDING.test(proxy.name));
}

function parseCountries(config) {
    const proxies = config.proxies || [];
    const countryCounts = Object.create(null);
    const compiledRegex = {};
    for (const [country, meta] of Object.entries(countriesMeta)) {
        compiledRegex[country] = new RegExp(meta.pattern.replace(/^\(\?i\)/, ''), 'i');
    }
    for (const proxy of proxies) {
        const name = proxy.name || '';
        if (REGEX_LANDING.test(name)) continue;
        for (const [country, regex] of Object.entries(compiledRegex)) {
            if (regex.test(name)) {
                countryCounts[country] = (countryCounts[country] || 0) + 1;
                break;
            }
        }
    }
    const result = [];
    for (const [country, count] of Object.entries(countryCounts)) {
        result.push({ country, count });
    }
    return result;
}

function buildProxyGroups({ landing, lowCost, ultraLowCost, highSpeed, defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback, autoSelectGroup, countryGroupNames, countries, proxies }) {
    const hasTW = countryGroupNames.some(name => name.includes("台湾"));
    const hasHK = countryGroupNames.some(name => name.includes("香港"));
    const hasMO = countryGroupNames.some(name => name.includes("澳门"));
    const frontProxySelector = landing ? defaultSelector.filter(name => name !== PROXY_GROUPS.LANDING && name !== PROXY_GROUPS.FALLBACK) : [];
    const aiProxies = buildList(landing && PROXY_GROUPS.LANDING, highSpeed && PROXY_GROUPS.HIGH_SPEED, countryGroupNames.find(name => name.includes("美国")), PROXY_GROUPS.MANUAL);
    const youtubeProxies = buildList(PROXY_GROUPS.SELECT, PROXY_GROUPS.AUTO_SELECT, highSpeed && PROXY_GROUPS.HIGH_SPEED, lowCost && PROXY_GROUPS.LOW_COST, PROXY_GROUPS.MANUAL);
    const biliProxies = buildList(PROXY_GROUPS.DIRECT, hasHK && countryGroupNames.find(name => name.includes("香港")), hasMO && countryGroupNames.find(name => name.includes("澳门")), hasTW && countryGroupNames.find(name => name.includes("台湾")));
    const streamingProxies = buildList(PROXY_GROUPS.SELECT, PROXY_GROUPS.AUTO_SELECT, highSpeed && PROXY_GROUPS.HIGH_SPEED, PROXY_GROUPS.MANUAL);
    const functionalProxies = buildList(PROXY_GROUPS.SELECT, PROXY_GROUPS.AUTO_SELECT, highSpeed && PROXY_GROUPS.HIGH_SPEED, lowCost && PROXY_GROUPS.LOW_COST, ...(countryGroupNames || []), PROXY_GROUPS.MANUAL, PROXY_GROUPS.DIRECT);

    return [
        { "name": PROXY_GROUPS.SELECT, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Proxy.png", "type": "select", "proxies": defaultSelector },
        { "name": "AI", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/ChatGPT.png", "type": "select", "proxies": aiProxies },
        { "name": "YouTube", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/YouTube.png", "type": "select", "proxies": youtubeProxies },
        { "name": "Bilibili", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/bilibili.png", "type": "select", "proxies": biliProxies },
        { "name": "流媒体", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Streaming.png", "type": "select", "proxies": streamingProxies },
        { "name": "通讯社交", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Telegram.png", "type": "select", "proxies": functionalProxies },
        { "name": "科技服务", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Google.png", "type": "select", "proxies": functionalProxies },
        { "name": "支付购物", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/PayPal.png", "type": "select", "proxies": functionalProxies },
        { "name": "游戏娱乐", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Game.png", "type": "select", "proxies": functionalProxies },
        { "name": "SSH(22端口)", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Server.png", "type": "select", "proxies": streamingProxies },
        { "name": "静态资源", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Cloudflare.png", "type": "select", "proxies": ["静态资源故障转移", PROXY_GROUPS.MANUAL, PROXY_GROUPS.DIRECT] },
        { "name": "广告拦截", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/AdBlack.png", "type": "select", "proxies": ["REJECT", "REJECT-DROP", PROXY_GROUPS.DIRECT] },
        { "name": PROXY_GROUPS.FALLBACK, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bypass.png", "type": "fallback", "url": "https://cp.cloudflare.com/generate_204", "proxies": defaultFallback, "interval": 180, "tolerance": 20, "lazy": false },
        { "name": "静态资源故障转移", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Bypass.png", "type": "fallback", "url": "https://cp.cloudflare.com/generate_204", "proxies": buildList(ultraLowCost && PROXY_GROUPS.ULTRA_LOW_COST, lowCost && PROXY_GROUPS.LOW_COST, PROXY_GROUPS.AUTO_SELECT), "interval": 180, "tolerance": 20, "lazy": false },
        autoSelectGroup,
        ...(countryGroupNames || []).map((name, index) => ({ "name": name, "icon": countriesMeta[countries[index]]?.icon || "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png", "type": "url-test", "url": "https://cp.cloudflare.com/generate_204", "interval": 60, "tolerance": 20, "lazy": false, "proxies": buildList((proxies || []).filter(p => p.name.includes(countries[index]) && !isSpecialNode(p.name)).map(p => p.name)) })).filter(group => group.proxies && group.proxies.length > 0),
        landing ? { "name": "前置代理", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Area.png", "type": "select", "include-all": true, "exclude-filter": "(?i)家宽|家庭|家庭宽带|商宽|商业宽带|星链|Starlink|落地", "proxies": frontProxySelector } : null,
        landing ? { "name": PROXY_GROUPS.LANDING, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Airport.png", "type": "select", "include-all": true, "filter": "(?i)家宽|家庭|家庭宽带|商宽|商业宽带|星链|Starlink|落地" } : null,
        highSpeed ? { "name": PROXY_GROUPS.HIGH_SPEED, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Rocket.png", "type": "url-test", "url": "https://cp.cloudflare.com/generate_204", "interval": 60, "tolerance": 20, "lazy": false, "include-all": true, "filter": "(?i)专线|GIA|CMI|9929|CN2" } : null,
        lowCost ? { "name": PROXY_GROUPS.LOW_COST, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Lab.png", "type": "load-balance", "strategy": "consistent-hashing", "url": "https://cp.cloudflare.com/generate_204", "include-all": true, "filter": "(?i)0\.1" } : null,
        ultraLowCost ? { "name": PROXY_GROUPS.ULTRA_LOW_COST, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Lab.png", "type": "url-test", "url": "https://cp.cloudflare.com/generate_204", "include-all": true, "filter": "(?i)0\.01" } : null,
        { "name": PROXY_GROUPS.MANUAL, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Static.png", "include-all": true, "type": "select" },
        { "name": PROXY_GROUPS.DIRECT, "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Direct.png", "type": "select", "proxies": ["DIRECT"] },
    ].filter(Boolean);
}

function main(config) {
    const resultConfig = { proxies: config.proxies };
    const countryInfo = parseCountries(resultConfig);
    const lowCost = hasLowCost(resultConfig);
    const ultraLowCost = hasUltraLowCost(resultConfig);
    const highSpeed = hasHighSpeedNodes(resultConfig);
    const landing = hasLandingNodes(resultConfig);

    let countryGroupNames = [];
    let countries = [];
    if (regionsEnabled) {
        const validProxies = (resultConfig.proxies || []).filter(p => !isSpecialNode(p.name));
        const validCountryInfo = parseCountries({ proxies: validProxies });
        countryGroupNames = getCountryGroupNames(validCountryInfo, countryThreshold);
        countries = stripNodeSuffix(countryGroupNames);
    }

    const { defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback } = buildBaseLists({ landing, lowCost, highSpeed });

    const groupType = loadBalance ? "load-balance" : "url-test";
    const autoSelectGroup = {
        "name": PROXY_GROUPS.AUTO_SELECT,
        "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png",
        "type": groupType,
        "proxies": countryGroupNames || []
    };
    if (!loadBalance) {
        Object.assign(autoSelectGroup, { "url": "https://cp.cloudflare.com/generate_204", "interval": 60, "tolerance": 20, "lazy": false });
    }

    const proxyGroups = buildProxyGroups({ landing, lowCost, ultraLowCost, highSpeed, defaultProxies, defaultProxiesDirect, defaultSelector, defaultFallback, autoSelectGroup, countryGroupNames, countries, proxies: resultConfig.proxies });

    const globalProxies = proxyGroups.map(item => item.name);
    proxyGroups.push({ "name": "GLOBAL", "icon": "https://cdn.jsdelivr.net/gh/Koolson/Qure@master/IconSet/Color/Global.png", "include-all": true, "type": "select", "proxies": globalProxies });

    const finalRules = buildRules({ quicEnabled });

    if (fullConfig) Object.assign(resultConfig, { "mixed-port": 7890, "redir-port": 7892, "tproxy-port": 7893, "routing-mark": 7894, "allow-lan": true, "ipv6": ipv6Enabled, "mode": "rule", "unified-delay": true, "tcp-concurrent": true, "find-process-mode": "off", "log-level": "info", "geodata-loader": "standard", "external-controller": ":9999", "disable-keep-alive": !keepAliveEnabled, "profile": { "store-selected": true } });

    Object.assign(resultConfig, { "proxy-groups": proxyGroups, "rule-providers": ruleProviders, "rules": finalRules, "sniffer": snifferConfig, "dns": fakeIPEnabled ? dnsConfigFakeIp : dnsConfig, "geodata-mode": true, "geox-url": geoxURL });

    return resultConfig;
}