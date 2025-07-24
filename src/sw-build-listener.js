export function setupSWBuildListener(onNewBuild) {
  if (!('serviceWorker' in navigator)) return;

  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SW_NEW_BUILD_READY') {
      console.log('[SW Listener] New build detected.');
      if (typeof onNewBuild === 'function') onNewBuild();
    }
  });
}
