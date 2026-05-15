<template>
  <div class="customer-discovery-page">
    <section class="discovery-toolbar">
      <div>
        <h2>客户挖掘</h2>
        <p>按配送线路搜索周边门店，标记可跟进的潜在客户。</p>
      </div>
      <el-button type="primary" icon="Search" :loading="searchLoading" @click="searchPlaces">搜索潜在客户</el-button>
    </section>

    <section class="discovery-layout">
      <aside class="discovery-side">
        <el-form label-position="top">
          <el-form-item label="配送线路">
            <el-select v-model="searchForm.routeId" placeholder="请选择线路" filterable style="width: 100%" @change="handleRouteChange">
              <el-option v-for="item in routeOptions" :key="item.routeId" :label="item.routeName" :value="item.routeId" />
            </el-select>
          </el-form-item>
          <el-form-item label="搜索关键词">
            <el-input v-model="searchForm.keyword" placeholder="粮油店、超市、食杂店" clearable @keyup.enter="searchPlaces" />
            <div class="keyword-row">
              <el-button v-for="item in keywordPresets" :key="item" size="small" plain @click="quickSearch(item)">
                {{ item }}
              </el-button>
            </div>
          </el-form-item>
          <el-form-item label="搜索半径">
            <el-slider v-model="searchForm.radius" :min="1000" :max="50000" :step="1000" show-input :show-input-controls="false" />
          </el-form-item>
        </el-form>

        <div class="result-summary">
          <strong>{{ discoveredPlaces.length }}</strong>
          <span>个搜索结果</span>
          <span v-if="selectedRouteName"> · {{ selectedRouteName }}</span>
        </div>

        <el-empty v-if="!discoveredPlaces.length" description="选择线路和关键词后开始搜索" />
        <div v-else class="place-list">
          <button
            v-for="place in discoveredPlaces"
            :key="place.uid"
            class="place-item"
            :class="{ 'is-active': activePlace?.uid === place.uid }"
            type="button"
            @click="focusPlace(place)"
          >
            <span class="place-title">
              <strong>{{ place.name }}</strong>
              <el-tag v-if="place.existingCustomer" size="small" type="warning">疑似已有</el-tag>
            </span>
            <span class="place-address">{{ place.address || '-' }}</span>
            <span class="place-meta">
              <span>{{ place.type || '未分类' }}</span>
              <span>{{ place.tel || '无电话' }}</span>
            </span>
          </button>
        </div>
      </aside>

      <main class="map-workspace">
        <el-alert
          v-if="!amapKey"
          class="map-alert"
          type="warning"
          show-icon
          :closable="false"
          title="请先在 .env 中配置 VITE_APP_AMAP_KEY，配置后可使用客户挖掘地图"
        />
        <div ref="mapContainerRef" v-loading="mapLoading" class="discovery-map"></div>
        <section v-if="activePlace" class="place-inspector">
          <div>
            <h3>{{ activePlace.name }}</h3>
            <p>{{ activePlace.address || '-' }}</p>
          </div>
          <div class="inspector-actions">
            <el-button icon="Phone" :disabled="!activePlace.tel" @click="copyText(activePlace.tel)">复制电话</el-button>
            <el-button icon="Location" :disabled="!activePlace.address" @click="copyText(activePlace.address)">复制地址</el-button>
          </div>
        </section>
      </main>
    </section>
  </div>
</template>

<script setup name="CustomerDiscovery" lang="ts">
import { getRouteCustomerOrderStats, listCustomer } from '@/api/system/customer';
import { CustomerVO, RouteCustomerOrderStatsVO } from '@/api/system/customer/types';
import { listRouteOptions } from '@/api/system/route';
import { RouteVO } from '@/api/system/route/types';

declare global {
  interface Window {
    AMap?: any;
    _AMapSecurityConfig?: {
      securityJsCode: string;
    };
    __amapLoading?: Promise<any>;
  }
}

interface DiscoveredPlace {
  id: string;
  uid: string;
  name: string;
  address: string;
  tel: string;
  type: string;
  location: {
    lng: number;
    lat: number;
  };
  existingCustomer: boolean;
}

const { proxy } = getCurrentInstance() as ComponentInternalInstance;
const amapKey = import.meta.env.VITE_APP_AMAP_KEY as string;
const amapSecurityCode = import.meta.env.VITE_APP_AMAP_SECURITY_CODE as string;
const keywordPresets = ['粮油店', '超市', '食杂店', '便利店', '餐饮店'];
const defaultCenter = [117.4295, 23.7021];

const searchForm = reactive({
  routeId: undefined as string | number | undefined,
  keyword: '粮油店',
  radius: 5000
});
const routeOptions = ref<RouteVO[]>([]);
const customerOptions = ref<CustomerVO[]>([]);
const routeCustomerOrderStats = ref<RouteCustomerOrderStatsVO[]>([]);
const discoveredPlaces = ref<DiscoveredPlace[]>([]);
const activePlace = ref<DiscoveredPlace>();
const mapContainerRef = ref<HTMLDivElement>();
const mapLoading = ref(false);
const searchLoading = ref(false);
let mapInstance: any;
let placeSearchInstance: any;
let geocoderInstance: any;
let placeMarkers: any[] = [];
let placeMarkerMap = new Map<string, any>();
let centerMarker: any;
let activeInfoWindow: any;
const centerMarkerLabel = ref('搜索中心');

const selectedRouteName = computed(() => routeOptions.value.find((item) => item.routeId === searchForm.routeId)?.routeName || '');

const routeCustomerOrderStatsMap = computed(() => {
  const map = new Map<string | number, RouteCustomerOrderStatsVO>();
  routeCustomerOrderStats.value.forEach((item) => map.set(item.customerId, item));
  return map;
});

const selectedRouteCustomers = computed(() => customerOptions.value.filter((customer) => String(customer.routeId) === String(searchForm.routeId)));

const existingCustomerKeys = computed(() => {
  const keys = new Set<string>();
  customerOptions.value.forEach((customer) => {
    if (customer.name) keys.add(normalizeText(customer.name));
    if (customer.phone) keys.add(normalizeText(customer.phone));
  });
  return keys;
});

const normalizeText = (value?: string) =>
  String(value || '')
    .replace(/\s+/g, '')
    .toLowerCase();

const isExistingCustomer = (place: Pick<DiscoveredPlace, 'name' | 'tel'>) => {
  const name = normalizeText(place.name);
  const tel = normalizeText(place.tel);
  return (!!name && existingCustomerKeys.value.has(name)) || (!!tel && existingCustomerKeys.value.has(tel));
};

const hasCustomerLocation = (customer: Pick<CustomerVO, 'longitude' | 'latitude'>) => {
  if (customer.longitude === null || customer.longitude === undefined || customer.latitude === null || customer.latitude === undefined) {
    return false;
  }
  const longitude = Number(customer.longitude);
  const latitude = Number(customer.latitude);
  return Number.isFinite(longitude) && Number.isFinite(latitude) && longitude >= -180 && longitude <= 180 && latitude >= -90 && latitude <= 90;
};

const loadAmapBase = async () => {
  if (window.AMap) {
    return window.AMap;
  }
  if (!amapKey) {
    throw new Error('请先配置高德地图 Key');
  }
  if (amapSecurityCode) {
    window._AMapSecurityConfig = {
      securityJsCode: amapSecurityCode
    };
  }
  if (!window.__amapLoading) {
    window.__amapLoading = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${amapKey}`;
      script.async = true;
      script.onload = () => resolve(window.AMap);
      script.onerror = () => reject(new Error('高德地图加载失败'));
      document.head.appendChild(script);
    });
  }
  return window.__amapLoading;
};

const loadAmapPlugins = (plugins: string[]) => {
  return new Promise<void>((resolve, reject) => {
    if (!window.AMap?.plugin) {
      reject(new Error('高德地图插件加载器不可用'));
      return;
    }
    window.AMap.plugin(plugins, () => resolve());
  });
};

const loadAmap = async () => {
  const AMap = await loadAmapBase();
  await loadAmapPlugins(['AMap.PlaceSearch', 'AMap.Geocoder']);
  return AMap;
};

const initMap = async () => {
  await nextTick();
  if (!mapContainerRef.value || !amapKey) {
    return;
  }
  const AMap = await loadAmap();
  if (!mapInstance) {
    mapInstance = new AMap.Map(mapContainerRef.value, {
      zoom: 11,
      center: defaultCenter
    });
  }
  if (!placeSearchInstance) {
    placeSearchInstance = new AMap.PlaceSearch({
      city: '漳州市',
      pageSize: 25,
      pageIndex: 1,
      extensions: 'base'
    });
  }
  if (!geocoderInstance) {
    geocoderInstance = new AMap.Geocoder({
      city: '漳州市'
    });
  }
};

const geocodeRouteCenter = async () => {
  await initMap();
  if (!geocoderInstance || !selectedRouteName.value) {
    return defaultCenter;
  }
  return new Promise<number[]>((resolve) => {
    geocoderInstance.getLocation(`${selectedRouteName.value} 漳州`, (status: string, result: any) => {
      const location = result?.geocodes?.[0]?.location;
      if (status === 'complete' && location) {
        resolve([Number(location.lng), Number(location.lat)]);
        return;
      }
      resolve(defaultCenter);
    });
  });
};

const loadRouteCustomerStats = async () => {
  if (!searchForm.routeId) {
    routeCustomerOrderStats.value = [];
    return;
  }
  try {
    const res = await getRouteCustomerOrderStats(searchForm.routeId);
    routeCustomerOrderStats.value = res.data || [];
  } catch {
    routeCustomerOrderStats.value = [];
  }
};

const resolveRouteCenter = async () => {
  await loadRouteCustomerStats();
  const centerCustomer = selectedRouteCustomers.value
    .filter(hasCustomerLocation)
    .map((customer) => ({
      customer,
      orderCount: Number(routeCustomerOrderStatsMap.value.get(customer.customerId)?.orderCount || 0)
    }))
    .sort((a, b) => b.orderCount - a.orderCount)[0]?.customer;

  if (centerCustomer) {
    centerMarkerLabel.value = `${selectedRouteName.value} · ${centerCustomer.name}`;
    return [Number(centerCustomer.longitude), Number(centerCustomer.latitude)];
  }
  centerMarkerLabel.value = selectedRouteName.value ? `${selectedRouteName.value} · 路线中心` : '搜索中心';
  return geocodeRouteCenter();
};

const clearMarkers = () => {
  if (!mapInstance) return;
  activeInfoWindow?.close();
  activeInfoWindow = undefined;
  if (placeMarkers.length) {
    mapInstance.remove(placeMarkers);
    placeMarkers = [];
  }
  placeMarkerMap = new Map();
  if (centerMarker) {
    mapInstance.remove(centerMarker);
    centerMarker = undefined;
  }
};

const buildInfoWindowContent = (place: DiscoveredPlace) => `
  <div class="discovery-info-window">
    <strong>${place.name}</strong>
    <span>${place.address || '-'}</span>
    <span>${place.tel || '无电话'}</span>
  </div>
`;

const setMarkerActive = (activeId?: string) => {
  placeMarkerMap.forEach((marker, markerId) => {
    marker.setLabel({
      content: marker.getExtData()?.label || '',
      direction: 'top'
    });
    marker.setzIndex(markerId === activeId ? 120 : 100);
  });
};

const renderMarkers = async (center: number[]) => {
  const AMap = await loadAmap();
  if (!mapInstance) return;
  clearMarkers();
  const label = centerMarkerLabel.value || selectedRouteName.value || '搜索中心';
  centerMarker = new AMap.Marker({
    position: center,
    title: label,
    icon: new AMap.Icon({
      size: new AMap.Size(26, 34),
      image: '//a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-red.png',
      imageSize: new AMap.Size(26, 34)
    }),
    offset: new AMap.Pixel(-13, -34),
    zIndex: 130,
    label: {
      content: label,
      direction: 'top'
    }
  });
  placeMarkers = discoveredPlaces.value.map((place, index) => {
    const marker = new AMap.Marker({
      position: [place.location.lng, place.location.lat],
      title: place.name,
      label: {
        content: `${index + 1}. ${place.name}`,
        direction: 'top'
      },
      zIndex: 100,
      extData: {
        label: `${index + 1}. ${place.name}`
      }
    });
    marker.on('click', () => focusPlace(place));
    placeMarkerMap.set(place.uid, marker);
    return marker;
  });
  mapInstance.add([centerMarker, ...placeMarkers]);
  mapInstance.setFitView([centerMarker, ...placeMarkers], false, [60, 60, 60, 60]);
};

const mapPoi = (poi: any, index: number): DiscoveredPlace | undefined => {
  const lng = Number(poi.location?.lng);
  const lat = Number(poi.location?.lat);
  if (!poi.id || !Number.isFinite(lng) || !Number.isFinite(lat)) {
    return undefined;
  }
  const place = {
    id: poi.id,
    uid: `${poi.id}-${lng}-${lat}-${index}`,
    name: poi.name || '',
    address: Array.isArray(poi.address) ? poi.address.join('') : poi.address || '',
    tel: Array.isArray(poi.tel) ? poi.tel.join(',') : poi.tel || '',
    type: poi.type || '',
    location: { lng, lat },
    existingCustomer: false
  };
  place.existingCustomer = isExistingCustomer(place);
  return place;
};

const searchPlaces = async () => {
  if (!searchForm.routeId) {
    proxy?.$modal.msgWarning('请先选择配送线路');
    return;
  }
  if (!searchForm.keyword.trim()) {
    proxy?.$modal.msgWarning('请输入搜索关键词');
    return;
  }
  searchLoading.value = true;
  mapLoading.value = true;
  try {
    await initMap();
    const center = await resolveRouteCenter();
    discoveredPlaces.value = await new Promise<DiscoveredPlace[]>((resolve, reject) => {
      placeSearchInstance.searchNearBy(searchForm.keyword.trim(), center, searchForm.radius, (status: string, result: any) => {
        if (status !== 'complete' && status !== 'no_data') {
          reject(new Error('地点搜索失败，请稍后重试'));
          return;
        }
        const pois = (result?.poiList?.pois || []).map(mapPoi).filter(Boolean);
        resolve(pois);
      });
    });
    activePlace.value = discoveredPlaces.value[0];
    await renderMarkers(center);
  } catch (error) {
    proxy?.$modal.msgError((error as Error).message || '客户挖掘搜索失败');
  } finally {
    searchLoading.value = false;
    mapLoading.value = false;
  }
};

const quickSearch = (keyword: string) => {
  searchForm.keyword = keyword;
  searchPlaces();
};

const handleRouteChange = async () => {
  discoveredPlaces.value = [];
  activePlace.value = undefined;
  mapLoading.value = true;
  try {
    await initMap();
    const center = await resolveRouteCenter();
    await renderMarkers(center);
  } catch (error) {
    proxy?.$modal.msgError((error as Error).message || '路线定位失败');
  } finally {
    mapLoading.value = false;
  }
};

const focusPlace = async (place: DiscoveredPlace) => {
  const AMap = await loadAmap();
  activePlace.value = place;
  await initMap();
  const position = new AMap.LngLat(place.location.lng, place.location.lat);
  const marker = placeMarkerMap.get(place.uid);
  setMarkerActive(place.uid);
  mapInstance?.setZoomAndCenter(17, position, false);
  mapInstance?.panTo(position);
  activeInfoWindow?.close();
  activeInfoWindow = new AMap.InfoWindow({
    content: buildInfoWindowContent(place),
    offset: new AMap.Pixel(0, -30)
  });
  activeInfoWindow.open(mapInstance, marker?.getPosition?.() || position);
};

const copyText = async (value?: string) => {
  if (!value) return;
  await navigator.clipboard.writeText(value);
  proxy?.$modal.msgSuccess('已复制');
};

const getRouteOptions = async () => {
  const res = await listRouteOptions();
  routeOptions.value = res.data || [];
  searchForm.routeId = routeOptions.value[0]?.routeId;
};

const getCustomerOptions = async () => {
  const res = await listCustomer({ pageNum: 1, pageSize: 9999 });
  customerOptions.value = res.rows || [];
};

onMounted(async () => {
  await Promise.all([getRouteOptions(), getCustomerOptions()]);
  await initMap();
  if (searchForm.routeId) {
    await handleRouteChange();
  }
});

onUnmounted(() => {
  clearMarkers();
  if (mapInstance) {
    mapInstance.destroy();
    mapInstance = undefined;
  }
});
</script>

<style scoped>
.customer-discovery-page {
  height: calc(100vh - 84px);
  min-height: 560px;
  padding: 12px 16px;
  background: #f5f7fa;
  overflow: hidden;
}

.discovery-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  height: 48px;
  margin-bottom: 10px;
}

.discovery-toolbar h2 {
  margin: 0 0 4px;
  color: #1f2d3d;
  font-size: 20px;
  line-height: 1.2;
}

.discovery-toolbar p {
  margin: 0;
  color: #667085;
  font-size: 13px;
}

.discovery-layout {
  display: grid;
  grid-template-columns: 360px minmax(0, 1fr);
  gap: 14px;
  height: calc(100% - 58px);
  min-height: 0;
}

.discovery-side,
.map-workspace {
  min-width: 0;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: #fff;
}

.discovery-side {
  display: flex;
  flex-direction: column;
  padding: 14px;
  overflow: hidden;
}

.keyword-row {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-top: 8px;
}

.result-summary {
  display: flex;
  align-items: baseline;
  gap: 6px;
  padding: 10px 0;
  border-top: 1px solid #ebeef5;
  color: #667085;
  font-size: 13px;
}

.result-summary strong {
  color: #0f766e;
  font-size: 24px;
  line-height: 1;
}

.place-list {
  flex: 1;
  min-height: 0;
  overflow: auto;
}

.place-item {
  width: 100%;
  display: grid;
  gap: 5px;
  padding: 11px 10px;
  border: 0;
  border-bottom: 1px solid #edf0f2;
  background: transparent;
  color: #303133;
  text-align: left;
  cursor: pointer;
}

.place-item:hover,
.place-item.is-active {
  background: #f0f9f7;
}

.place-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.place-title strong,
.place-address,
.place-meta span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.place-address {
  color: #606266;
  font-size: 13px;
}

.place-meta {
  display: flex;
  gap: 10px;
  color: #909399;
  font-size: 12px;
}

.map-workspace {
  position: relative;
  overflow: hidden;
  min-height: 0;
}

.map-alert {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  z-index: 2;
}

.discovery-map {
  width: 100%;
  height: 100%;
  min-height: 0;
}

.place-inspector {
  position: absolute;
  right: 16px;
  bottom: 16px;
  left: 16px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 16px;
  border: 1px solid #dcdfe6;
  border-radius: 6px;
  background: rgb(255 255 255 / 94%);
  box-shadow: 0 8px 24px rgb(15 23 42 / 12%);
}

.place-inspector h3 {
  margin: 0 0 4px;
  color: #1f2d3d;
  font-size: 16px;
}

.place-inspector p {
  margin: 0;
  color: #606266;
}

.inspector-actions {
  display: flex;
  flex: 0 0 auto;
  gap: 8px;
}

:deep(.amap-marker-label) {
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  padding: 2px 6px;
  color: #303133;
  font-size: 12px;
  box-shadow: 0 2px 8px rgb(0 0 0 / 10%);
}

:deep(.discovery-info-window) {
  display: grid;
  gap: 4px;
  min-width: 220px;
  color: #303133;
  font-size: 13px;
  line-height: 1.5;
}

:deep(.discovery-info-window strong) {
  color: #0f766e;
  font-size: 14px;
}

:deep(.discovery-info-window span) {
  color: #606266;
}

@media (max-width: 1180px) {
  .discovery-layout {
    grid-template-columns: 1fr;
  }

  .discovery-side {
    max-height: none;
  }
}
</style>
