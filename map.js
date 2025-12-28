// 地图配置
const MAP_CONFIG = {
    center: [22.1987, 113.5439], // 澳门内港坐标
    zoom: 15,
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
};

// 初始化地图函数
function initMap(containerId = "mapContainer") {
    // 检查 Leaflet 是否加载
    if (typeof L === 'undefined') {
        console.error("Leaflet 未加载，请引入 Leaflet 库");
        return null;
    }

    // 创建地图实例
    const map = L.map(containerId).setView(MAP_CONFIG.center, MAP_CONFIG.zoom);

    // 添加瓦片图层
    L.tileLayer(MAP_CONFIG.tileUrl, {
        attribution: MAP_CONFIG.attribution
    }).addTo(map);

    // 添加标记点
    L.marker(MAP_CONFIG.center).addTo(map)
        .bindPopup("澳门内港 · 照片拍摄地")
        .openPopup();

    return map;
}