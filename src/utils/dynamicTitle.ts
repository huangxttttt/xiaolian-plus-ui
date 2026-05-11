import { useSettingsStore } from '@/store/modules/settings';

/**
 * 动态修改标题
 */
export const useDynamicTitle = () => {
  const settingsStore = useSettingsStore();
  const appTitle = settingsStore.appTitle || import.meta.env.VITE_APP_TITLE;
  if (settingsStore.dynamicTitle) {
    document.title = settingsStore.title + ' - ' + appTitle;
  } else {
    document.title = appTitle;
  }
};
