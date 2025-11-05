document.addEventListener('DOMContentLoaded', function () {
  const mapContainer = document.getElementById('macau-map');

  // 1. 初始化地图（定位到澳门）
  const map = L.map(mapContainer).setView([22.2939, 113.3326], 15); // 澳门经纬度 + 缩放级别

  // 2. 添加 OpenStreetMap 图层（无 API Key）
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
  }).addTo(map);

  // 3. 标记澳门内港拍摄点（示例：十月初五街）
  const shootingPoint = L.marker([22.292, 113.331]).addTo(map);
  shootingPoint.bindPopup("<b>十月初五街</b><br>澳门内港拍摄点").openPopup();
});


