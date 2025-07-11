import { App } from "./app.js";
import { store } from "./store.js";
import { actions } from "./actions/index.js";
import { controller } from "./controllers";

const enableMocking = async () => {
  try {
    const { worker } = await import("./mocks/browser.js");
    const serviceWorkerUrl = import.meta.env.PROD
      ? "/front_6th_chapter1-1/mockServiceWorker.js"
      : "/mockServiceWorker.js";

    await worker.start({
      onUnhandledRequest: "bypass",
      serviceWorker: {
        url: serviceWorkerUrl,
      },
    });
  } catch (error) {
    console.warn("MSW를 시작할 수 없습니다:", error);
  }
};

function render() {
  const rootElement = document.body.querySelector("#root");
  if (rootElement) {
    rootElement.innerHTML = App();
  }
}

async function main() {
  render();

  await controller.initialize();

  let lastRoute = null;

  if (import.meta.env.MODE === "test") {
    controller.resetLastRoute = () => {
      lastRoute = null;
    };
  }

  store.subscribe((state) => {
    if (state.currentRoute !== lastRoute) {
      lastRoute = state.currentRoute;
      controller.handleRouteChange(state.currentRoute);
    }

    render();
  });

  const basePath = import.meta.env.PROD ? "/front_6th_chapter1-1" : "";
  let initialPath = location.pathname;
  if (basePath && initialPath.startsWith(basePath)) {
    initialPath = initialPath.slice(basePath.length) || "/";
  }

  store.dispatch(actions.navigate(initialPath));
}

// 애플리케이션 시작
if (import.meta.env.MODE !== "test") {
  enableMocking().then(main);
} else {
  main();
}
